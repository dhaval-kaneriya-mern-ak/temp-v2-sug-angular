import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap, shareReplay } from 'rxjs/operators';
import { SugApiService } from './sug-api.service';
import { UserStateService } from './user-state.service';

/**
 * Interface for verification details API response
 */
export interface IVerificationDetailsResponse {
  success: boolean;
  message: string[];
  data: {
    isfeatureenabled: boolean;
    isfullmember: number;
    verified: number; // 0 = not verified, 1 = verified
    haspword: boolean;
    isfullandverified: boolean;
  };
}

export interface ISendVerificationCodeResponse {
  success: boolean;
  message: string[];
  data: {
    success: boolean;
  };
}

export interface IValidateVerificationCodeResponse {
  success: boolean;
  message: string[];
  data: {
    success: boolean;
  };
}

/**
 * Service to handle user verification operations
 * Manages verification status checks and code verification flow
 */
@Injectable({
  providedIn: 'root',
})
export class VerificationService {
  private readonly sugApiService = inject(SugApiService);
  private readonly userStateService = inject(UserStateService);

  private verificationRequest$: Observable<number> | null = null;
  /**
   * Main function to check and ensure verification status.
   * Handles all state scenarios and decides whether to call the API or return cached value.
   *
   * @param forceRefresh - If true, ignores cached state and forces an API call (e.g., after OTP validation)
   * @returns Observable<boolean> - True if verified, False otherwise
   */
  ensureVerificationStatus(forceRefresh = false): Observable<boolean> {
    const isVerified = this.userStateService.isUserVerified();
    const isLoaded = this.userStateService.isVerificationLoaded();

    // Scenarios: Data is loaded and we are not forcing a refresh
    // Return the cached value immediately
    if (isLoaded && !forceRefresh) {
      return of(isVerified);
    }

    // Scenarios: (Not loaded or Failed) OR Force Refresh
    // Call the API
    return this.checkVerificationStatus(forceRefresh).pipe(
      map((verified) => Number(verified) === 1),
      catchError(() => of(false))
    );
  }

  /**
   * Internal API call to fetch verification details.
   * Updates UserStateService based on the response.
   */
  checkVerificationStatus(forceRefresh = false): Observable<number> {
    if (this.verificationRequest$ && !forceRefresh) {
      return this.verificationRequest$;
    }

    // Create the request and cache it
    this.verificationRequest$ = this.sugApiService
      .get<IVerificationDetailsResponse>('/member/verificationdetails')
      .pipe(
        map((response: IVerificationDetailsResponse) => {
          if (response.success && response.data) {
            this.userStateService.setVerifyApiFailed(false);
            this.userStateService.setVerificationStatus(response.data.verified);
            return response.data.verified;
          } else {
            this.userStateService.setVerifyApiFailed(true);
            return 0;
          }
        }),
        catchError((error) => {
          this.userStateService.setVerifyApiFailed(true);
          throw error;
        }),
        // Multicast the result to all subscribers (App, Guard, etc.)
        shareReplay(1)
      );

    return this.verificationRequest$;
  }

  /**
   * Send verification code to user's email
   */
  sendVerificationCode(): Observable<ISendVerificationCodeResponse> {
    return this.sugApiService.get<ISendVerificationCodeResponse>(
      '/member/sendverificationcode'
    );
  }

  /**
   * Validate member verification code.
   * If validation is successful, it AUTOMATICALLY refreshes the verification status.
   */
  validateVerificationCode(
    code: string
  ): Observable<IValidateVerificationCodeResponse> {
    const payload = { code };
    return this.sugApiService
      .post<IValidateVerificationCodeResponse>(
        '/member/validatememberverificationcode',
        payload
      )
      .pipe(
        switchMap((response) => {
          // If validation succeeded, force refresh the verification status
          // so the rest of the app knows the user is now verified.
          if (response.success && response.data?.success) {
            return this.ensureVerificationStatus(true).pipe(
              map(() => response) // Return the original response to the caller
            );
          }
          return of(response);
        })
      );
  }
}
