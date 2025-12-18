import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { VerificationService } from '@services/verification.service';
import { map } from 'rxjs';
import { VerificationModalService } from '@services/verification-modal.service';

/**
 * Verification Guard
 * Checks if user is verified before allowing access to protected routes
 * Returns true if verified, false if not verified (will show verification modal instead)
 */
export const verificationGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const modalService = inject(VerificationModalService);
  const verificationService = inject(VerificationService);

  return verificationService.ensureVerificationStatus().pipe(
    map((isVerified) => {
      if (isVerified) return true;

      const navigation = router.getCurrentNavigation();
      const isDirectAccess = !navigation?.previousNavigation;

      if (isDirectAccess) {
        // 1. Get the full URL path the user tried to access
        const url = state.url;

        // 2. Split into segments
        const segments = url.split('/').filter((s) => s);

        // 3. Determine the parent path
        // If we are at "/messages/compose", parent is "/messages"

        // Strategy: Remove the segments belonging to the current route config

        let parentPath = '/';

        if (segments.length > 1) {
          // We can find the index of the current route's path in the segments
          const currentPath = route.routeConfig?.path;

          if (currentPath) {
            const index = segments.lastIndexOf(currentPath);
            if (index > 0) {
              // Slice up to that index to get the parent path
              parentPath = '/' + segments.slice(0, index).join('/');
            }
          }
        }

        // Fallback: If we couldn't determine parent, or it's root, maybe default to a known safe route or just '/'
        if (parentPath === '/' && segments.length > 0) {
          parentPath = '/' + segments[0];
        }
        // Open modal and store the intended URL
        modalService.open(state.url);

        return router.createUrlTree([parentPath]);
      }

      modalService.open(state.url);
      return false;
    })
  );
};
