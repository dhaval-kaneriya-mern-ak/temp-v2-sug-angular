import { Injectable, signal, type Signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

declare global {
  interface Window {
    freestar: {
      queue: Array<() => void>;
      config: {
        enabled_slots: Array<{ placementName: string; slotId: string }>;
      };
      initCallback: () => void;
      initCallbackCalled?: boolean;
      newAdSlots: (
        slots: Array<{ placementName: string; slotId: string }>
      ) => void;
      refreshAllSlots?: () => void;
    };
  }

  // Google Publisher Tag API
  var googletag:
    | {
        pubads: () => {
          set: (key: string, value: string) => void;
        };
      }
    | undefined;
}

/**
 * Ad units configuration for a specific device type
 */
export interface AdUnitsByDevice {
  top?: string;
  bottom?: string;
  right?: string;
}

/**
 * Complete ad units configuration for both desktop and mobile
 */
export interface AdUnitsConfig {
  desktop?: AdUnitsByDevice;
  mobile?: AdUnitsByDevice;
}

/**
 * Route data structure that can include ad units configuration
 */
export interface RouteDataWithAdUnits {
  showAds?: boolean;
  adUnits?: AdUnitsConfig;
  title?: string;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class FreestarService {
  private readonly publisher = 'signupgenius-com';
  private scriptLoaded = false;
  private scriptLoading = false;
  private initTimeout: ReturnType<typeof setTimeout> | null = null;
  private isInitializing = false;
  private readonly adsEnabled = signal<boolean>(true);

  private static readonly MOBILE_BREAKPOINT = 768;

  /**
   * Route group configuration map for ad units fallback
   * Maps route path prefixes to ad units configuration
   * Used when route data doesn't specify adUnits
   */
  private readonly routeGroupAdUnits: Record<string, AdUnitsConfig> = {
    // Messages route group - mobile only top, desktop has all positions
    messages: {
      desktop: {
        top: 'signupgenius_Desktop_Members_Messages_728x90_Top',
        bottom: 'signupgenius_Desktop_Members_Messages_728x90_Bot',
        right: 'signupgenius_Desktop_Members_Messages_300x600_Right',
      },
      mobile: {
        top: 'signupgenius_mobile_members_messages_320x50_top',
        bottom: '', // No bottom ad for messages menu on mobile
      },
    },
    // Add more route groups as needed
    // reports: { ... },
  };

  /**
   * Enable or disable ads globally at runtime.
   * When disabled, the service becomes a no-op (no script load, no slot registration).
   * Also cleans up any existing Freestar resources when disabled.
   */
  setAdsEnabled(enabled: boolean): void {
    const previousValue = this.adsEnabled();
    this.adsEnabled.set(enabled);

    // If disabling ads, clean up all Freestar resources
    if (!enabled && previousValue !== enabled) {
      this.cleanupFreestarResources();
    }
  }

  /**
   * Check if ads are enabled (for components to decide visibility).
   * Returns a readonly signal for reactive updates.
   */
  areAdsEnabled(): Signal<boolean> {
    return this.adsEnabled.asReadonly();
  }

  /**
   * Initialize Freestar framework
   */
  initializeFreestar(): void {
    if (!this.adsEnabled()) {
      return;
    }
    // console.log('[FreestarService] Proceeding with Freestar initialization');
    if (typeof window === 'undefined') {
      return;
    }

    // Add preconnect links for performance (only when ads are enabled)
    this.addPreconnectLinks();

    // Initialize freestar object if not exists, or ensure required properties exist
    if (!window.freestar) {
      window.freestar = {
        queue: [],
        config: {
          enabled_slots: [],
        },
        initCallback: () => {
          if (window.freestar.config.enabled_slots.length === 0) {
            window.freestar.initCallbackCalled = false;
          } else {
            window.freestar.newAdSlots(window.freestar.config.enabled_slots);
          }
        },
        newAdSlots: (
          _slots: Array<{ placementName: string; slotId: string }>
        ) => {
          // This will be implemented by the Freestar script
          // Stub function - parameter intentionally unused
          void _slots;
        },
      };
      // console.log('[Freestar] Framework initialized');
    } else {
      // Ensure required properties exist even if freestar was partially initialized
      if (!window.freestar.queue) {
        window.freestar.queue = [];
      }
      if (!window.freestar.config) {
        window.freestar.config = {
          enabled_slots: [],
        };
      }
      if (!window.freestar.config.enabled_slots) {
        window.freestar.config.enabled_slots = [];
      }
      if (!window.freestar.initCallback) {
        window.freestar.initCallback = () => {
          if (window.freestar.config.enabled_slots.length === 0) {
            window.freestar.initCallbackCalled = false;
          } else {
            window.freestar.newAdSlots(window.freestar.config.enabled_slots);
          }
        };
      }
      if (!window.freestar.newAdSlots) {
        window.freestar.newAdSlots = (
          _slots: Array<{ placementName: string; slotId: string }>
        ) => {
          // This will be implemented by the Freestar script
          // Stub function - parameter intentionally unused
          void _slots;
        };
      }
    }

    // Queue page_url setting to run after Freestar script loads
    this.queuePageUrlSetting();

    // Load Freestar script if not already loaded
    if (!this.scriptLoaded && !this.scriptLoading) {
      this.loadFreestarScript();
    } else if (this.scriptLoaded) {
      // If script is already loaded, set page_url immediately
      this.setPageUrl();
    }
  }

  /**
   * Add preconnect links for Freestar domains to improve ad loading performance
   * Only called when ads are enabled
   */
  private addPreconnectLinks(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const preconnectUrls = [
      'https://a.pub.network/',
      'https://b.pub.network/',
      'https://c.pub.network/',
      'https://d.pub.network/',
      'https://c.amazon-adsystem.com',
      'https://s.amazon-adsystem.com',
      'https://btloader.com/',
      'https://api.btloader.com/',
    ];

    preconnectUrls.forEach((url) => {
      // Check if link already exists
      const existingLink = document.querySelector(
        `link[rel="preconnect"][href="${url}"]`
      );
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url;
        link.setAttribute('crossorigin', '');
        document.head.appendChild(link);
      }
    });
  }

  /**
   * Clean up Freestar scripts and links when ads are disabled
   * Removes scripts, CSS, and preconnect links to prevent any network requests
   */
  private cleanupFreestarResources(): void {
    if (typeof document === 'undefined') {
      return;
    }

    // Remove Freestar script
    const script = document.querySelector('script[src*="pubfig.min.js"]');
    if (script) {
      script.remove();
      this.scriptLoaded = false;
      this.scriptLoading = false;
    }

    // Remove Freestar CSS
    const cssLink = document.querySelector('link[href*="cls.css"]');
    if (cssLink) {
      cssLink.remove();
    }

    // Remove preconnect links
    const preconnectUrls = [
      'https://a.pub.network/',
      'https://b.pub.network/',
      'https://c.pub.network/',
      'https://d.pub.network/',
      'https://c.amazon-adsystem.com',
      'https://s.amazon-adsystem.com',
      'https://btloader.com/',
      'https://api.btloader.com/',
    ];

    preconnectUrls.forEach((url) => {
      const link = document.querySelector(
        `link[rel="preconnect"][href="${url}"]`
      );
      if (link) {
        link.remove();
      }
    });

    // Clear freestar object to prevent any further execution
    if (typeof window !== 'undefined' && window.freestar) {
      // Clear the queue to prevent queued functions from executing
      if (window.freestar.queue) {
        window.freestar.queue = [];
      }
      // Don't delete window.freestar entirely as other code might check for its existence
      // Instead, ensure it's in a safe state
      window.freestar.config = { enabled_slots: [] };
    }
  }

  /**
   * Load Freestar script dynamically
   */
  private loadFreestarScript(): void {
    if (this.scriptLoading || this.scriptLoaded) {
      return;
    }

    this.scriptLoading = true;

    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src*="pubfig.min.js"]'
    );
    if (existingScript) {
      this.scriptLoaded = true;
      this.scriptLoading = false;
      this.executeQueuedFunctions();
      // Set page_url if script already exists
      this.setPageUrl();
      return;
    }

    // Load CSS first
    const existingCSS = document.querySelector('link[href*="cls.css"]');
    if (!existingCSS) {
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = `https://a.pub.network/${this.publisher}/cls.css`;
      document.head.appendChild(cssLink);
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = `https://a.pub.network/${this.publisher}/pubfig.min.js`;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.onload = () => {
      this.scriptLoaded = true;
      this.scriptLoading = false;
      // console.log('[Freestar] Script loaded successfully');
      this.executeQueuedFunctions();
      // Set page_url after script loads and googletag is available
      this.setPageUrl();
    };
    script.onerror = () => {
      console.error('[Freestar] Failed to load script from:', script.src);
      this.scriptLoading = false;
    };

    document.head.appendChild(script);
  }

  /**
   * Execute queued functions after script loads
   */
  private executeQueuedFunctions(): void {
    if (window.freestar && window.freestar.queue) {
      window.freestar.queue.forEach((fn) => {
        try {
          fn();
        } catch (error) {
          console.error('Error executing Freestar queue function:', error);
        }
      });
      window.freestar.queue = [];
    }
  }

  /**
   * Queue page_url setting to run after Freestar script loads
   * Only sets page_url if origin is NOT https://signupgenius.com
   */
  private queuePageUrlSetting(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Check if current origin is NOT signupgenius.com
    if (window.location.origin !== 'https://signupgenius.com') {
      // Queue the page_url setting to run after Freestar script loads
      // Note: window.freestar should already be initialized by initializeFreestar() before this is called
      if (window.freestar && window.freestar.queue) {
        window.freestar.queue.push(() => {
          this.setPageUrl();
        });
      }
    }
  }

  /**
   * Set page_url for googletag
   * Only sets if origin is NOT https://signupgenius.com
   * Waits for googletag to be available before setting
   */
  private setPageUrl(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Check if current origin is NOT signupgenius.com
    if (window.location.origin !== 'https://signupgenius.com') {
      // Wait for googletag to be available
      this.waitForGoogletag(() => {
        if (typeof googletag !== 'undefined' && googletag.pubads) {
          try {
            googletag.pubads().set('page_url', 'https://signupgenius.com/');
            console.log('[Freestar] Set page_url to https://signupgenius.com/');
          } catch (error) {
            console.error('[Freestar] Error setting page_url:', error);
          }
        } else {
          console.warn(
            '[Freestar] googletag.pubads() still not available after waiting'
          );
        }
      });
    } else {
      console.log(
        '[Freestar] Skipping page_url setting - origin is https://signupgenius.com'
      );
    }
  }

  /**
   * Wait for googletag to be available, then execute callback
   * Uses polling with timeout to avoid infinite waiting
   */
  private waitForGoogletag(
    callback: () => void,
    maxAttempts = 50,
    attempt = 0
  ): void {
    if (
      typeof googletag !== 'undefined' &&
      typeof googletag.pubads === 'function'
    ) {
      try {
        // Try to call pubads() to verify it's actually available
        const pubads = googletag.pubads();
        if (pubads) {
          callback();
          return;
        }
      } catch {
        // pubads() not ready yet, continue waiting
      }
    }

    if (attempt >= maxAttempts) {
      console.warn(
        '[Freestar] googletag.pubads() not available after waiting, giving up'
      );
      return;
    }

    // Wait a bit and try again
    setTimeout(() => {
      this.waitForGoogletag(callback, maxAttempts, attempt + 1);
    }, 100); // Check every 100ms
  }

  /**
   * Register an ad slot
   */
  registerAdSlot(placementName: string, slotId: string): void {
    if (!this.adsEnabled()) {
      return;
    }

    this.initializeFreestar();

    if (!window.freestar) {
      // console.log(
      //   '[FreestarService] window.freestar not available, skipping registration'
      // );
      return;
    }

    // Check if slot is already registered
    const existingSlot = window.freestar.config.enabled_slots.find(
      (slot) => slot.slotId === slotId
    );

    if (existingSlot) {
      return;
    }

    // Register the slot
    window.freestar.config.enabled_slots.push({
      placementName,
      slotId,
    });
    // console.log('[Freestar] Registered ad slot:', { placementName, slotId });

    // Debounce initialization - wait a bit for all slots to register before initializing
    if (this.initTimeout) {
      clearTimeout(this.initTimeout);
    }

    this.initTimeout = setTimeout(() => {
      this.initializeAllSlots();
    }, 50); // Small delay to batch multiple slot registrations
  }

  /**
   * Initialize all registered ad slots
   */
  private initializeAllSlots(): void {
    if (!this.adsEnabled()) {
      return;
    }
    if (!window.freestar || window.freestar.config.enabled_slots.length === 0) {
      return;
    }

    // Prevent duplicate initializations
    if (this.isInitializing) {
      // console.log(
      //   '[Freestar] Already initializing slots, skipping duplicate call'
      // );
      return;
    }

    this.isInitializing = true;

    const initSlots = () => {
      // Set page_url BEFORE initializing slots
      this.setPageUrl();

      // Check if the real Freestar newAdSlots is available (not our stub)
      const isRealFunction =
        window.freestar?.newAdSlots &&
        typeof window.freestar.newAdSlots === 'function' &&
        window.freestar.newAdSlots.toString().indexOf('stub') === -1;

      if (isRealFunction) {
        // Call newAdSlots with all enabled slots (Freestar expects all slots at once)
        // console.log(
        //   '[Freestar] Initializing all ad slots:',
        //   window.freestar.config.enabled_slots
        // );
        try {
          window.freestar.newAdSlots(window.freestar.config.enabled_slots);
          this.isInitializing = false;
        } catch (error) {
          console.error('[Freestar] Error calling newAdSlots:', error);
          this.isInitializing = false;
        }
      } else {
        // console.log(
        //   '[Freestar] Waiting for Freestar script to provide newAdSlots...'
        // );
        // If script is loaded but newAdSlots is still stub, wait a bit more
        setTimeout(() => {
          const isRealNow =
            window.freestar?.newAdSlots &&
            typeof window.freestar.newAdSlots === 'function' &&
            window.freestar.newAdSlots.toString().indexOf('stub') === -1;

          if (isRealNow && window.freestar.config.enabled_slots.length > 0) {
            // Set page_url BEFORE initializing slots (delayed)
            this.setPageUrl();

            // console.log(
            //   '[Freestar] Initializing all ad slots (delayed):',
            //   window.freestar.config.enabled_slots
            // );
            try {
              window.freestar.newAdSlots(window.freestar.config.enabled_slots);
              this.isInitializing = false;
            } catch (error) {
              console.error(
                '[Freestar] Error calling newAdSlots (delayed):',
                error
              );
              this.isInitializing = false;
            }
          } else {
            this.isInitializing = false;
          }
        }, 200);
      }
    };

    // If script is loaded, initialize immediately
    if (this.scriptLoaded) {
      initSlots();
    } else {
      // Queue for later execution when script loads
      window.freestar.queue.push(() => {
        initSlots();
      });
    }
  }

  /**
   * Refresh all ad slots (useful for SPA navigation)
   */
  refreshAllSlots(): void {
    if (!this.adsEnabled()) {
      return;
    }
    if (!window.freestar) {
      return;
    }

    // Reset initialization flag to allow re-initialization
    this.isInitializing = false;

    // If refreshAllSlots is available, use it
    if (window.freestar.refreshAllSlots) {
      // console.log('[Freestar] Refreshing all slots');
      window.freestar.refreshAllSlots();
    } else if (
      this.scriptLoaded &&
      window.freestar.config.enabled_slots.length > 0
    ) {
      // If refreshAllSlots is not available but script is loaded, re-initialize slots
      // console.log('[Freestar] Re-initializing slots after route change');
      this.initializeAllSlots();
    }

    // Re-set page_url on route change to ensure it's still set correctly
    // Only set if origin is NOT https://signupgenius.com
    this.setPageUrl();
  }

  /**
   * Get ad unit name based on position, device type, and route context
   *
   * Resolution order:
   * 1. Check route data for adUnits (traversing up route tree, child overrides parent)
   * 2. Check route group configuration based on route path
   * 3. Return empty string if no configuration found (no static fallback)
   *
   * @param position - Ad position (top, bottom, right)
   * @param isMobile - Whether device is mobile
   * @param activatedRoute - ActivatedRoute to check for route data (optional)
   * @returns Ad unit name or empty string if not configured
   */
  getAdUnitName(
    position: 'top' | 'bottom' | 'right',
    isMobile: boolean,
    activatedRoute?: ActivatedRoute | null
  ): string {
    // Try to get ad units from route data first
    let adUnitsConfig: AdUnitsConfig | undefined;

    if (activatedRoute) {
      adUnitsConfig = this.getAdUnitsFromRoute(activatedRoute);
    }

    // If no route data config, try route group fallback
    if (!adUnitsConfig && activatedRoute) {
      const routePath = this.getRoutePath(activatedRoute);
      adUnitsConfig = this.getAdUnitsFromRouteGroup(routePath);
    }

    // If still no config, return empty string (no static fallback)
    if (!adUnitsConfig) {
      // console.log(
      //   '[FreestarService] No ad units configuration found for route, returning empty string'
      // );
      return '';
    }

    // Get device-specific ad units
    const deviceAdUnits = isMobile
      ? adUnitsConfig.mobile
      : adUnitsConfig.desktop;

    if (!deviceAdUnits) {
      return '';
    }

    // Get ad unit for the requested position
    const adUnit = deviceAdUnits[position];
    return adUnit || '';
  }

  /**
   * Traverse route tree to find adUnits configuration
   * Child routes override parent routes if both have adUnits
   *
   * @param route - ActivatedRoute to start traversal from
   * @returns AdUnitsConfig if found, undefined otherwise
   */
  private getAdUnitsFromRoute(
    route: ActivatedRoute | null
  ): AdUnitsConfig | undefined {
    if (!route) {
      return undefined;
    }

    // Find the deepest active route if we're at root
    let currentRoute = route;
    if (route.snapshot.url.length === 0 && route.firstChild) {
      // Traverse down to find the deepest route
      while (currentRoute.firstChild) {
        currentRoute = currentRoute.firstChild;
      }
    }

    // Check current route first (child routes override parent)
    const currentData = currentRoute.snapshot.data as
      | RouteDataWithAdUnits
      | undefined;
    if (currentData?.adUnits) {
      // console.log(
      //   '[FreestarService] Found adUnits in route data:',
      //   currentData.adUnits
      // );
      return currentData.adUnits;
    }

    // Traverse up to parent routes
    let parent: ActivatedRoute | null = currentRoute.parent;
    while (parent) {
      const parentData = parent.snapshot.data as
        | RouteDataWithAdUnits
        | undefined;
      if (parentData?.adUnits) {
        // console.log(
        //   '[FreestarService] Found adUnits in parent route data:',
        //   parentData.adUnits
        // );
        return parentData.adUnits;
      }
      parent = parent.parent;
    }

    return undefined;
  }

  /**
   * Get route path string for route group matching
   * Returns the first segment of the route path (e.g., 'messages', 'reports')
   *
   * @param route - ActivatedRoute to get path from
   * @returns Route path segment or empty string
   */
  private getRoutePath(route: ActivatedRoute): string {
    if (!route) {
      return '';
    }

    // Find the deepest active route if we're at root
    let currentRoute = route;
    if (route.snapshot.url.length === 0 && route.firstChild) {
      // Traverse down to find the deepest route
      while (currentRoute.firstChild) {
        currentRoute = currentRoute.firstChild;
      }
    }

    // Get the full route path
    const segments: string[] = [];
    let current: ActivatedRoute | null = currentRoute;

    while (current) {
      if (current.snapshot.url.length > 0) {
        segments.unshift(...current.snapshot.url.map((s) => s.path));
      }
      current = current.parent;
    }

    // Get the first segment (route group)
    const fullPath = segments.join('/');
    const firstSegment = fullPath.split('/')[0];

    return firstSegment || '';
  }

  /**
   * Get ad units configuration from route group map
   *
   * @param routePath - Route path to match against route groups
   * @returns AdUnitsConfig if route group found, undefined otherwise
   */
  private getAdUnitsFromRouteGroup(
    routePath: string
  ): AdUnitsConfig | undefined {
    if (!routePath) {
      return undefined;
    }

    // Check if route path matches any route group
    const routeGroupConfig = this.routeGroupAdUnits[routePath];
    if (routeGroupConfig) {
      // console.log(
      //   '[FreestarService] Found adUnits in route group config:',
      //   routePath,
      //   routeGroupConfig
      // );
      return routeGroupConfig;
    }

    return undefined;
  }

  /**
   * Check if device is mobile
   */
  isMobileDevice(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.innerWidth <= FreestarService.MOBILE_BREAKPOINT;
  }
}
