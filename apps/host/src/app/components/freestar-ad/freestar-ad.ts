import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
  AfterViewInit,
  inject,
  input,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FreestarService } from '@services/freestar.service';

@Component({
  selector: 'sug-freestar-ad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './freestar-ad.html',
  styleUrls: ['./freestar-ad.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FreestarAdComponent implements OnInit, AfterViewInit {
  position = input<'top' | 'bottom' | 'right'>('top');
  adUnitName = input<string | undefined>();

  @ViewChild('adContainer', { static: false })
  adContainer!: ElementRef<HTMLDivElement>;

  private readonly slotId = signal<string>('');
  private readonly isMobile = signal<boolean>(false);
  private readonly adUnitNameInternal = signal<string | undefined>(undefined);

  private readonly freestarService = inject(FreestarService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // Computed signal for shouldDisplay
  readonly shouldDisplay = computed(() => {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    if (!this.freestarService.areAdsEnabled()()) {
      return false;
    }

    // Don't show mobile ads for right position
    if (this.position() === 'right' && this.isMobile()) {
      return false;
    }

    const adUnit = this.adUnitName() || this.adUnitNameInternal();
    return !!adUnit;
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.freestarService.areAdsEnabled()()) {
      return;
    }

    this.isMobile.set(this.freestarService.isMobileDevice());

    // Initialize ad unit name (only if not provided as input)
    const providedAdUnitName = this.adUnitName();
    if (!providedAdUnitName) {
      this.updateAdUnitName();
    } else {
      this.adUnitNameInternal.set(providedAdUnitName);
      this.generateSlotId(providedAdUnitName);
    }

    // Subscribe to route changes for dynamic updates (only if adUnitName not provided)
    if (!providedAdUnitName) {
      this.router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          this.updateAdUnitName();
          const currentAdUnit = this.adUnitName() || this.adUnitNameInternal();
          if (currentAdUnit && this.adContainer) {
            this.setupAdSlot();
          }
        });
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (!this.freestarService.areAdsEnabled()()) {
      return;
    }

    // Ensure ad unit name is set (only if not provided as input)
    const providedAdUnitName = this.adUnitName();
    if (!providedAdUnitName) {
      this.updateAdUnitName();
    }

    const currentAdUnit = providedAdUnitName || this.adUnitNameInternal();
    const currentSlotId = this.slotId();

    if (!currentAdUnit || !currentSlotId) {
      return;
    }

    this.setupAdSlot();
  }

  /**
   * Setup ad slot in the DOM
   */
  private setupAdSlot(): void {
    const adUnitName = this.adUnitName() || this.adUnitNameInternal();
    const slotId = this.slotId();

    if (!adUnitName || !slotId) {
      return;
    }

    // Use setTimeout to ensure DOM is fully rendered (especially with @if directive)
    // afterNextRender requires injection context, so we use setTimeout as a fallback
    setTimeout(() => {
      // Check if container exists
      if (!this.adContainer?.nativeElement) {
        console.warn('[FreestarAd] Container not found after timeout!');
        return;
      }

      // Set the ad container attributes
      const container = this.adContainer.nativeElement;
      container.id = slotId;

      // Set data-freestar-ad attribute based on ad size
      const adSize = this.getAdSize(adUnitName);
      container.setAttribute('data-freestar-ad', adSize);

      // Register the ad slot
      this.freestarService.registerAdSlot(adUnitName, slotId);
    }, 0);
  }

  /**
   * Update ad unit name based on current route and position
   * Only updates if adUnitName is not provided as input
   */
  private updateAdUnitName(): void {
    // Only look up ad unit if not explicitly provided as input
    if (this.adUnitName()) {
      return;
    }

    // Get ad unit name from route configuration
    const newAdUnitName = this.freestarService.getAdUnitName(
      this.position(),
      this.isMobile(),
      this.activatedRoute
    );

    // Update ad unit name if found
    if (newAdUnitName) {
      this.adUnitNameInternal.set(newAdUnitName);
      this.generateSlotId(newAdUnitName);
    } else {
      // No ad unit found for this route/position
      this.adUnitNameInternal.set(undefined);
      this.slotId.set('');
    }
  }

  /**
   * Generate slot ID for ad unit
   */
  private generateSlotId(adUnitName: string): void {
    const currentSlotId = this.slotId();
    if (!currentSlotId || !currentSlotId.startsWith(adUnitName)) {
      this.slotId.set(`${adUnitName}_${Date.now()}`);
    }
  }

  /**
   * Get ad size string for data-freestar-ad attribute
   */
  private getAdSize(adUnitName: string): string {
    if (!adUnitName) {
      return '__728x90';
    }

    if (adUnitName.includes('728x90')) {
      return '__728x90';
    }
    if (adUnitName.includes('300x600')) {
      return '__300x600';
    }
    if (adUnitName.includes('160x600')) {
      return '__160x600';
    }
    if (adUnitName.includes('320x50')) {
      return '__320x50';
    }

    return '__728x90'; // Default
  }
}
