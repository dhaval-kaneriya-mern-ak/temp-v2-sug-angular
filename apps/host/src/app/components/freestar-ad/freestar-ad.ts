import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
  AfterViewInit,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { FreestarService } from '@services/freestar.service';

@Component({
  selector: 'sug-freestar-ad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './freestar-ad.html',
  styleUrls: ['./freestar-ad.scss'],
})
export class FreestarAdComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() position: 'top' | 'bottom' | 'right' = 'top';
  @Input() adUnitName?: string;

  @ViewChild('adContainer', { static: false })
  adContainer!: ElementRef<HTMLDivElement>;

  private slotId = '';
  private isMobile = false;
  private _shouldDisplay: boolean | null = null;

  private readonly freestarService = inject(FreestarService);
  private readonly platformId: object = inject(PLATFORM_ID);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    // console.log('[FreestarAd] ===== COMPONENT CREATED =====');
    // console.log('[FreestarAd] ngOnInit called, position:', this.position);
    // console.log('[FreestarAd] Component will check ads enabled status now...');
    if (!isPlatformBrowser(this.platformId)) {
      // console.log('[FreestarAd] Not in browser, skipping');
      return;
    }

    // Respect global ads policy (e.g., disable for PRO users)
    const adsEnabled = this.freestarService.areAdsEnabled();
    // console.log('[FreestarAd] Ads enabled check:', adsEnabled);
    if (!adsEnabled) {
      // console.log(
      //   '[FreestarAd] Ads disabled by policy, skipping initialization'
      // );
      this._shouldDisplay = false;
      return;
    }
    // console.log('[FreestarAd] Ads enabled, proceeding with initialization');

    this.isMobile = this.freestarService.isMobileDevice();
    // console.log(
    //   '[FreestarAd] Device type:',
    //   this.isMobile ? 'mobile' : 'desktop'
    // );

    // Initialize ad unit name (only if not provided as input)
    if (!this.adUnitName) {
      this.updateAdUnitName();
    }

    // Subscribe to route changes for dynamic updates (only if adUnitName not provided)
    if (!this.adUnitName) {
      this.router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          // console.log('[FreestarAd] Route changed, updating ad unit');
          this.updateAdUnitName();
          // Recalculate display status
          this._shouldDisplay = this.calculateShouldDisplay();
          // Re-setup ad slot if ad unit changed
          if (this.adUnitName && this.adContainer) {
            this.setupAdSlot();
          }
        });
    }

    // Calculate shouldDisplay once during initialization
    this._shouldDisplay = this.calculateShouldDisplay();
  }

  ngAfterViewInit(): void {
    // console.log(
    //   '[FreestarAd] ngAfterViewInit called, position:',
    //   this.position
    // );
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (!this.freestarService.areAdsEnabled()) {
      return;
    }

    // Ensure ad unit name is set (only if not provided as input)
    if (!this.adUnitName) {
      this.updateAdUnitName();
    }

    if (!this.adUnitName || !this.slotId) {
      // console.log('[FreestarAd] Missing adUnitName or slotId, skipping');
      return;
    }

    this.setupAdSlot();
  }

  /**
   * Setup ad slot in the DOM
   */
  private setupAdSlot(): void {
    if (!this.adUnitName || !this.slotId) {
      return;
    }

    // Store values in local variables for TypeScript type narrowing
    const adUnitName = this.adUnitName;
    const slotId = this.slotId;

    // Use setTimeout to ensure DOM is fully rendered (especially with @if directive)
    setTimeout(() => {
      // Check if container exists
      if (!this.adContainer || !this.adContainer.nativeElement) {
        console.warn('[FreestarAd] Container not found after timeout!');
        return;
      }

      // console.log('[FreestarAd] Container found, setting up ad slot');

      // Set the ad container attributes
      const container = this.adContainer.nativeElement;
      container.id = slotId;

      // Set data-freestar-ad attribute based on ad size
      const adSize = this.getAdSize();
      container.setAttribute('data-freestar-ad', adSize);
      // console.log('[FreestarAd] Set container attributes:', {
      //   id: slotId,
      //   'data-freestar-ad': adSize,
      // });

      // Register the ad slot
      this.freestarService.registerAdSlot(adUnitName, slotId);
    }, 0);
  }

  ngOnDestroy(): void {
    // console.log('[FreestarAd] ngOnDestroy called');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Update ad unit name based on current route and position
   * Only updates if adUnitName is not provided as input
   */
  private updateAdUnitName(): void {
    // Only look up ad unit if not explicitly provided as input
    if (this.adUnitName) {
      return;
    }

    // Get ad unit name from route configuration
    const newAdUnitName = this.freestarService.getAdUnitName(
      this.position,
      this.isMobile,
      this.activatedRoute
    );

    // console.log('[FreestarAd] Ad unit name from route:', newAdUnitName);

    // Update ad unit name if found
    if (newAdUnitName) {
      // Generate new slot ID if ad unit changed
      if (!this.slotId || !this.slotId.startsWith(newAdUnitName)) {
        this.adUnitName = newAdUnitName;
        this.slotId = `${newAdUnitName}_${Date.now()}`;
        // console.log('[FreestarAd] Generated slot ID:', this.slotId);
      } else {
        this.adUnitName = newAdUnitName;
      }
    } else {
      // No ad unit found for this route/position
      // console.log('[FreestarAd] No ad unit name found for route, clearing');
      this.adUnitName = '';
      this.slotId = '';
    }
  }

  /**
   * Get ad size string for data-freestar-ad attribute
   */
  private getAdSize(): string {
    if (!this.adUnitName) {
      return '__728x90';
    }

    if (this.adUnitName.includes('728x90')) {
      return '__728x90';
    }
    if (this.adUnitName.includes('300x600')) {
      return '__300x600';
    }
    if (this.adUnitName.includes('160x600')) {
      return '__160x600';
    }
    if (this.adUnitName.includes('320x50')) {
      return '__320x50';
    }

    return '__728x90'; // Default
  }

  /**
   * Check if ad should be displayed (cached getter to avoid repeated calculations)
   */
  get shouldDisplay(): boolean {
    if (this._shouldDisplay === null) {
      this._shouldDisplay = this.calculateShouldDisplay();
    }
    return this._shouldDisplay;
  }

  /**
   * Calculate if ad should be displayed (internal method)
   */
  private calculateShouldDisplay(): boolean {
    // console.log(
    //   '[FreestarAd] calculateShouldDisplay called, position:',
    //   this.position
    // );

    if (!isPlatformBrowser(this.platformId)) {
      // console.log('[FreestarAd] Not in browser, shouldDisplay = false');
      return false;
    }

    const adsEnabled = this.freestarService.areAdsEnabled();
    // console.log(
    //   '[FreestarAd] Ads enabled in calculateShouldDisplay:',
    //   adsEnabled
    // );
    if (!adsEnabled) {
      // console.log('[FreestarAd] Ads disabled, shouldDisplay = false');
      return false;
    }

    // Don't show mobile ads for right position
    if (this.position === 'right' && this.isMobile) {
      // console.log(
      //   '[FreestarAd] Right position on mobile, shouldDisplay = false'
      // );
      return false;
    }

    const hasAdUnitName = !!this.adUnitName;
    // console.log('[FreestarAd] Final shouldDisplay calculation:', {
    //   hasAdUnitName,
    //   adUnitName: this.adUnitName,
    //   result: hasAdUnitName,
    // });
    return hasAdUnitName;
  }
}
