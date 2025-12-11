import {
  Component,
  ViewEncapsulation,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import {
  RouterModule,
  Router,
  NavigationEnd,
  ActivatedRoute,
} from '@angular/router';
import { HeaderComponent } from './components/header/header';
import { FooterComponent } from './components/footer/footer';
import { Sidebar } from './components/sidebar/sidebar';
import { FreestarAdComponent } from './components/freestar-ad/freestar-ad';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FreestarService } from '@services/freestar.service';
import { UserStateService } from '@services/user-state.service';
import { VerificationService } from '@services/verification.service';
import { MemberProfile } from '@services/interfaces';
import { SugUiLoadingSpinnerComponent } from '@lumaverse/sug-ui';
import { AdRouteService } from '@services/ad-route.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  imports: [
    RouterModule,
    CommonModule,
    HeaderComponent,
    FooterComponent,
    Sidebar,
    FreestarAdComponent,
    SugUiLoadingSpinnerComponent,
  ],
  selector: 'sug-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss', './config/global.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class App implements OnInit, OnDestroy {
  protected title = 'host';
  profileLoaded = false;
  private destroy$ = new Subject<void>();

  private readonly freestarService = inject(FreestarService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly userStateService = inject(UserStateService);
  private readonly verificationService = inject(VerificationService);
  private readonly adRouteService = inject(AdRouteService);
  private readonly platformId: object = inject(PLATFORM_ID);

  // Signal that tracks whether ads should be shown based on route data
  readonly shouldShowAds = toSignal(
    this.adRouteService.createShouldShowAds$(this.activatedRoute),
    {
      initialValue: false,
    }
  );

  // constructor(
  //   private router: Router,
  //   private freestarService: FreestarService
  // ) {}

  ngOnInit(): void {
    // console.log('[App] Component initialized, current URL:', this.router.url);

    // Set up router subscription early to catch redirects (before profile loads)
    this.setupRouterSubscription();

    // Decide ads policy based on user profile (ispro)
    const currentProfile = this.userStateService.getCurrentProfile();
    // console.log('[App] Current profile check:', {
    //   hasProfile: !!currentProfile,
    //   profile: currentProfile,
    //   ispro: currentProfile?.ispro,
    // });

    if (currentProfile) {
      // console.log(
      //   '[App] Profile already loaded, applying ads policy immediately'
      // );
      this.applyAdsPolicy(currentProfile);
      this.profileLoaded = true;

      // Call verification API for already loaded profile
      this.loadVerificationStatus();
    } else {
      // console.log('[App] Profile not loaded yet, loading profile...');
      this.userStateService.loadUserProfile().subscribe({
        next: (resp) => {
          const profile = resp?.data ?? null;
          // console.log('[App] Profile loaded successfully:', {
          //   hasProfile: !!profile,
          //   profile: profile,
          //   ispro: profile?.ispro,
          //   responseSuccess: resp?.success,
          // });
          this.applyAdsPolicy(profile);
          this.profileLoaded = true;

          // Call verification API after profile is loaded
          this.loadVerificationStatus();
        },
        error: (err) => {
          console.error('[App] Error loading profile:', err);
          console.log('[App] Profile API error - attempting token refresh');

          // Try to refresh token before redirecting to login
          this.userStateService.refreshToken().subscribe({
            next: () => {
              // console.log(
              //   '[App] Token refresh successful, retrying profile load'
              // );
              // Clear profile state before retrying to ensure fresh load
              this.userStateService.clearUserProfile();
              // Retry loading profile after successful token refresh
              this.userStateService.loadUserProfile().subscribe({
                next: (resp) => {
                  const profile = resp?.data ?? null;
                  // console.log(
                  //   '[App] Profile loaded successfully after refresh:',
                  //   {
                  //     hasProfile: !!profile,
                  //     profile: profile,
                  //     ispro: profile?.ispro,
                  //     responseSuccess: resp?.success,
                  //   }
                  // );
                  this.applyAdsPolicy(profile);
                  this.profileLoaded = true;

                  // Call verification API after profile is loaded
                  this.loadVerificationStatus();
                },
                error: (retryErr) => {
                  console.error(
                    '[App] Profile load failed after token refresh:',
                    retryErr
                  );
                  this.redirectToLogin();
                },
              });
            },
            error: (refreshErr) => {
              console.error('[App] Token refresh failed:', refreshErr);
              // console.log(
              //   '[App] Redirecting to login after refresh token failure'
              // );
              this.redirectToLogin();
            },
          });
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Set up router subscription to handle route changes and ad refreshes
   * This is set up early to catch redirects that happen before profile loads
   */
  private setupRouterSubscription(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          // console.log('[App] Navigation ended, new URL:', event.url);
          // Use router state root to find active route
          const activeRoute = this.router.routerState.root;
          let currentRoute = activeRoute;
          // Traverse down to find deepest active route
          while (currentRoute.firstChild) {
            currentRoute = currentRoute.firstChild;
          }
          const showAds = this.adRouteService.shouldShowAds(currentRoute);
          // console.log('[App] Route showAds value:', showAds);

          // Only refresh ads if they're enabled (for free users) and route allows ads
          if (this.freestarService.areAdsEnabled()() && showAds) {
            // Refresh Freestar ads on route change (after page components initialize)
            setTimeout(() => {
              this.freestarService.refreshAllSlots();
            }, 100);
          }
        }
      });
  }

  /**
   * Redirect to login page with current path as prior parameter
   */
  private redirectToLogin(): void {
    // Get just the path (e.g., /messages/dashboard)
    const currentPath = this.router.url;
    const encodedPath = encodeURIComponent(currentPath);
    const loginUrl = `/index.cfm?go=c.login&prior=${encodedPath}`;
    // console.log('[App] Redirecting to:', loginUrl);
    // console.log('[App] Current path:', currentPath);
    window.location.href = loginUrl;
  }

  private applyAdsPolicy(profile: MemberProfile | null): void {
    // console.log('[App] applyAdsPolicy called with profile:', {
    //   hasProfile: !!profile,
    //   profileKeys: profile ? Object.keys(profile) : [],
    //   ispro: profile?.ispro,
    //   fullProfile: profile,
    // });

    // Determine pro status - ispro is a boolean on MemberProfile
    const isPro = !!(profile && profile.ispro);

    // console.log('[App] Pro status determination:', {
    //   isPro,
    //   isproValue: profile?.ispro,
    // });

    // Enable/disable ads globally
    const adsShouldBeEnabled = !isPro;
    // console.log('[App] Setting ads enabled:', adsShouldBeEnabled);
    this.freestarService.setAdsEnabled(adsShouldBeEnabled);

    // Verify the setting took effect
    // const actualAdsEnabled = this.freestarService.areAdsEnabled();
    // console.log('[App] Ads enabled status after setting:', actualAdsEnabled);

    if (isPro) {
      // console.log(
      //   '[App] User is PRO: ads disabled, skipping Freestar initialization'
      // );
      return; // Do not initialize Freestar
    }

    // console.log('[App] User is FREE: initializing Freestar');
    // Initialize Freestar for free users
    this.freestarService.initializeFreestar();
  }

  /**
   * Check if an ad should be displayed at a specific position
   * This checks if ads are enabled, route allows ads, and if there's an ad unit configured
   */
  shouldShowAdAtPosition(position: 'top' | 'bottom' | 'right'): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    // Check if ads are enabled globally
    if (!this.freestarService.areAdsEnabled()()) {
      return false;
    }

    // Check if route allows ads
    if (!this.shouldShowAds()) {
      return false;
    }

    // Don't show right position ads on mobile
    const isMobile = this.freestarService.isMobileDevice();
    if (position === 'right' && isMobile) {
      return false;
    }

    // Check if there's an ad unit configured for this position
    const adUnitName = this.freestarService.getAdUnitName(
      position,
      isMobile,
      this.activatedRoute
    );

    return !!adUnitName;
  }

  // private updateRouteState(url: string): void {
  //   const showAds = this.adRouteService.shouldShowAds(this.activatedRoute);
  //   console.log('[App] Route state updated:', {
  //     url,
  //     showAds,
  //     willShowAds: showAds && this.freestarService.areAdsEnabled(),
  //   });
  // }

  /**
   * Load user verification status and store in UserStateService
   * Called after profile is loaded
   */
  private loadVerificationStatus(): void {
    this.verificationService.checkVerificationStatus().subscribe({
      next: (verified: number) => {
        this.userStateService.setVerificationStatus(verified);
      },
      error: (err: HttpErrorResponse) => {
        console.error('[App] Error loading verification status:', err);
        // Set to not verified on error
        this.userStateService.setVerificationStatus(0);
      },
    });
  }
}
