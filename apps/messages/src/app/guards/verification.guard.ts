import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserStateService } from '@services/user-state.service';
import { filter, map, take } from 'rxjs/operators';

/**
 * Verification Guard
 * Checks if user is verified before allowing access to protected routes
 * Returns true if verified, false if not verified (will show verification modal instead)
 */
export const verificationGuard: CanActivateFn = (route, state) => {
  const userStateService = inject(UserStateService);

  return userStateService.getVerificationState().pipe(
    filter((state) => state.isLoaded),
    take(1),
    map((state) => state.isVerified)
  );
};
