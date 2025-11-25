import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { SugApiService } from './sug-api.service';
import { ApiResponse, MemberProfile } from './interfaces';
import { Observable, of, throwError } from 'rxjs';
import { shareReplay, catchError, tap, finalize, map } from 'rxjs/operators';
import { USER_PROFILE_SUBJECT } from './user-profile-token';
import { format } from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class UserStateService implements OnDestroy {
  private readonly sugApiService = inject(SugApiService);

  // Inject the shared BehaviorSubject (works across module federation)
  private readonly _userProfile$ = inject(USER_PROFILE_SUBJECT);

  // Signal for reactive state
  private readonly _userProfile = signal<MemberProfile | null>(null);

  // Public readonly signals and observables
  readonly userProfile = this._userProfile.asReadonly();
  readonly userProfile$ = this._userProfile$.asObservable();

  // Optimized loading state management
  private _loadingObservable: Observable<ApiResponse<MemberProfile>> | null =
    null;
  private _isProfileLoaded = false;

  /**
   * Load user profile from API - optimized with shareReplay for single API call
   */
  loadUserProfile(): Observable<ApiResponse<MemberProfile>> {
    // If already loaded, return cached result immediately
    const currentProfile = this._userProfile();
    if (this._isProfileLoaded && currentProfile) {
      return of({
        data: currentProfile,
        success: true,
      } as ApiResponse<MemberProfile>);
    }

    // If already loading, return the shared observable
    if (this._loadingObservable) {
      return this._loadingObservable;
    }

    // Create new loading observable with shareReplay for caching
    this._loadingObservable = this.sugApiService
      .get<ApiResponse<MemberProfile>>('/member/profile')
      .pipe(
        tap((response: ApiResponse<MemberProfile>) => {
          if (response.success && response.data) {
            this.setUserProfile(response.data);
            this._userProfile.set(response.data);
            this._userProfile$.next(response.data);
            this._isProfileLoaded = true;
          }
        }),
        catchError((error: Error) => {
          this._userProfile.set(null);
          this._userProfile$.next(null);
          return throwError(() => error);
        }),
        finalize(() => {
          // Reset loading observable after completion
          this._loadingObservable = null;
        }),
        shareReplay(1) // Cache the last emitted value and share with multiple subscribers
      );

    return this._loadingObservable;
  }

  /**
   * Check if profile is already loaded
   */
  isProfileLoaded(): boolean {
    return this._isProfileLoaded && this._userProfile() !== null;
  }

  /**
   * Get the current user profile value
   */
  getCurrentProfile(): MemberProfile | null {
    return this._userProfile();
  }

  /**
   * Set user profile (useful for testing or manual updates)
   */
  setUserProfile(profile: MemberProfile | null): void {
    this._userProfile.set(profile);
    this._userProfile$.next(profile);
  }

  /**
   * Clear user profile (for logout)
   */
  clearUserProfile(): void {
    this._userProfile.set(null);
    this._userProfile$.next(null);
    this._isProfileLoaded = false;
    this._loadingObservable = null;
  }

  /**
   * Refresh authentication token
   * POST to v3/auth/refresh with empty refreshToken and token
   */
  refreshToken(): Observable<any> {
    const payload = {
      refreshToken: '',
      token: '',
    };
    return this.sugApiService.post<any>('v3/auth/refresh', payload);
  }

  /**
   * Get display name for the user's subscription plan
   */
  getPlanDisplayName(userProfile?: MemberProfile | null): string {
    const profile = userProfile ?? this._userProfile();

    if (!profile) return 'Free';
    if (profile.istrial) return 'Trial';

    // Use optional chaining and nullish coalescing for cleaner code
    return profile.subscription?.productname || 'Free';
  }

  /**
   * Check if user should see the schedule tab
   * Show schedule tab if: istrial=true OR productcode contains gold|platinum|enterprise
   */
  shouldShowScheduleTab(userProfile?: MemberProfile | null): boolean {
    const profile = userProfile ?? this._userProfile();
    if (!profile) return false;

    // Early return for trial users
    if (profile.istrial) return true;

    const productCode = profile.subscription?.productcode?.toLowerCase();
    if (!productCode) return false;

    // Use Set for O(1) lookup performance if we had exact matches,
    // but since we need 'includes', this is still optimal
    return ['gold', 'platinum', 'enterprise'].some((tier) =>
      productCode.includes(tier)
    );
  }

  /**
   * Check if user has premium features based on subscription
   */
  hasPremiumFeatures(userProfile?: MemberProfile | null): boolean {
    return this.shouldShowScheduleTab(userProfile); // Reuse existing logic
  }

  /**
   * Check schedule access - simplified for route guard
   */
  checkScheduleAccess(): Observable<boolean> {
    const currentProfile = this._userProfile();

    if (currentProfile) {
      return of(this.shouldShowScheduleTab(currentProfile));
    }

    return this.loadUserProfile().pipe(
      map((response: ApiResponse<MemberProfile>) =>
        response.success && response.data
          ? this.shouldShowScheduleTab(response.data)
          : false
      ),
      catchError(() => of(false))
    );
  }

  /**
   * Validate email format using RFC 5322 standard regex pattern
   * @param email - The email address to validate
   * @returns true if valid email format, false otherwise
   */
  isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;

    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email.trim());
  }


  isBasicUser(userProfile?: MemberProfile | null): boolean {
    const profile = userProfile ?? this._userProfile();
    if (!profile) return true; // Treat null profile as basic user

    const isBasic = profile.istrial === false && profile.ispro === false;
    return isBasic;
  }

  /**
   * Cleanup resources
   */
  ngOnDestroy(): void {
    this._userProfile$.complete();
  }
}
