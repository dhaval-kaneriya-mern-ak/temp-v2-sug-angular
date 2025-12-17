import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  // Router
} from '@angular/router';
// import { UserStateService } from '@services/user-state.service';
import { VerificationService } from '@services/verification.service';
import { map } from 'rxjs';
// import { filter, map, take } from 'rxjs/operators';
/**
 * Verification Guard
 * Checks if user is verified before allowing access to protected routes
 * Returns true if verified, false if not verified (will show verification modal instead)
 */
export const verificationGuard: CanActivateFn = (route, state) => {
  // const verificationService = inject(VerificationService);

  // // This handles all scenarios:
  // // 1. If not loaded -> Calls API, waits, returns result
  // // 2. If loaded -> Returns cached result immediately
  // // 3. If API failed -> Retries
  // return verificationService.ensureVerificationStatus();
  const verificationService = inject(VerificationService);
  const router = inject(Router);

  return verificationService.ensureVerificationStatus().pipe(
    map((isVerified) => {
      if (isVerified) {
        return true;
      }

      // Check if direct URL access
      const navigation = router.getCurrentNavigation();
      const isDirectAccess = !navigation?.previousNavigation;

      // Direct access: redirect to /messages (TabLayout will show modal)
      if (isDirectAccess) {
        // Manually navigate to dashboard with state
        router.navigate(['/messages'], {
          state: { showVerificationModal: true },
        });
        return false;
      }

      // Internal navigation: block (TabLayout handles it)
      return false;
    })
  );
};
