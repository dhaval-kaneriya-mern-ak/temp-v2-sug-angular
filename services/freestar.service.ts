import { Injectable } from '@angular/core';
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
  private adsEnabled = true;

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
   */
  setAdsEnabled(enabled: boolean): void {
    // console.log('[FreestarService] setAdsEnabled called:', {
    //   enabled,
    //   previousValue: this.adsEnabled,
    // });
    this.adsEnabled = enabled;
    // console.log('[FreestarService] adsEnabled is now:', this.adsEnabled);
  }

  /**
   * Check if ads are enabled (for components to decide visibility).
   */
  areAdsEnabled(): boolean {
    // console.log(
    //   '[FreestarService] areAdsEnabled called, returning:',
    //   this.adsEnabled
    // );
    return this.adsEnabled;
  }

  /**
   * Initialize Freestar framework
   */
  initializeFreestar(): void {
    // console.log(
    //   '[FreestarService] initializeFreestar called, adsEnabled:',
    //   this.adsEnabled
    // );
    if (!this.adsEnabled) {
      // console.log('[FreestarService] Ads disabled, skipping initialization');
      return;
    }
    // console.log('[FreestarService] Proceeding with Freestar initialization');
    if (typeof window === 'undefined') {
      return;
    }

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
          slots: Array<{ placementName: string; slotId: string }>
        ) => {
          // This will be implemented by the Freestar script
          //console.log('[Freestar] newAdSlots called (stub)', slots);
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
          slots: Array<{ placementName: string; slotId: string }>
        ) => {
          // This will be implemented by the Freestar script
          // console.log('[Freestar] newAdSlots called (stub)', slots);
        };
      }
    }

    // Load Freestar script if not already loaded
    if (!this.scriptLoaded && !this.scriptLoading) {
      this.loadFreestarScript();
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
   * Register an ad slot
   */
  registerAdSlot(placementName: string, slotId: string): void {
    // console.log('[FreestarService] registerAdSlot called:', {
    //   placementName,
    //   slotId,
    //   adsEnabled: this.adsEnabled,
    // });

    if (!this.adsEnabled) {
      // console.log('[FreestarService] Ads disabled, skipping slot registration');
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
    if (!this.adsEnabled) {
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
    if (!this.adsEnabled) {
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
    if (typeof googletag !== 'undefined' && googletag.pubads) {
      try {
        googletag.pubads().set('page_url', 'https://signupgenius.com/');
        // console.log('[Freestar] Re-set page_url after route change');
      } catch (error) {
        console.error('[Freestar] Error re-setting page_url:', error);
      }
    }
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
    return window.innerWidth <= 768;
  }
}
