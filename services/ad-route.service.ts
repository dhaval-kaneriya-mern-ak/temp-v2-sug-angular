import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AdUnitsConfig, RouteDataWithAdUnits } from './freestar.service';

/**
 * Service to determine if ads should be shown based on route data configuration.
 * Uses route data property 'showAds' as the single source of truth.
 * Traverses route tree to find showAds value (supports nested routes).
 */
@Injectable({
  providedIn: 'root',
})
export class AdRouteService {
  private readonly router = inject(Router);

  /**
   * Observable that emits true/false when route changes and showAds value is determined
   * Uses router state root to find active route (works from any component level)
   */
  createShouldShowAds$(activatedRoute: ActivatedRoute): Observable<boolean> {
    return this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null), // Emit initial value
      map(() => {
        // Use router state root to find active route, or use provided route
        const activeRoute = this.findActiveRoute(this.router.routerState.root);
        return this.shouldShowAds(activeRoute);
      })
    );
  }

  /**
   * Check if ads should be shown for the given route
   * Traverses up the route tree to find showAds value
   * If route is root, finds the active child route first
   * @param route - ActivatedRoute to check (required - must be passed from component)
   * @returns true if ads should be shown, false otherwise
   */
  shouldShowAds(route: ActivatedRoute): boolean {
    // If route is root and has no data, find the active child route
    let current: ActivatedRoute | null = route;

    // Traverse down to find the deepest active route if we're at root
    if (
      current === this.router.routerState.root &&
      !current.snapshot.data?.['showAds']
    ) {
      current = this.findActiveRoute(this.router.routerState.root);
    }

    // Traverse up the route tree to find showAds value
    while (current) {
      // Check if this route has showAds in its data
      const showAds = current.snapshot.data?.['showAds'];
      if (showAds !== undefined) {
        // console.log('[AdRouteService] Found showAds in route:', {
        //   path: current.snapshot.routeConfig?.path,
        //   showAds,
        // });
        return showAds === true;
      }

      // Move to parent route
      current = current.parent;
    }

    // Default: no ads if not explicitly configured
    // console.log('[AdRouteService] No showAds found in route tree, returning false');
    return false;
  }

  /**
   * Find the deepest active route by traversing down the route tree
   * @param route - Starting route (usually root)
   * @returns The deepest active ActivatedRoute
   */
  private findActiveRoute(route: ActivatedRoute): ActivatedRoute {
    let current: ActivatedRoute = route;

    // Traverse down to find the deepest route with children
    while (current.firstChild) {
      current = current.firstChild;
    }

    return current;
  }

  /**
   * Get ad units configuration from route tree
   * Traverses up the route tree to find adUnits value
   * Child routes override parent routes if both have adUnits
   * @param route - ActivatedRoute to check (required - must be passed from component)
   * @returns AdUnitsConfig if found, undefined otherwise
   */
  getAdUnitsConfig(route: ActivatedRoute): AdUnitsConfig | undefined {
    // Traverse up the route tree to find adUnits value
    let current: ActivatedRoute | null = route;

    while (current) {
      // Check if this route has adUnits in its data
      const routeData = current.snapshot.data as
        | RouteDataWithAdUnits
        | undefined;
      if (routeData?.adUnits) {
        return routeData.adUnits;
      }

      // Move to parent route
      current = current.parent;
    }

    // No adUnits configuration found
    return undefined;
  }
}
