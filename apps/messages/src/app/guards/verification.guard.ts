import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { UserStateService } from '@services/user-state.service';

/**
 * Verification Guard
 * Checks if user is verified before allowing access to protected routes
 * Returns true if verified, false if not verified (will show verification modal instead)
 */
export const verificationGuard: CanActivateFn = () => {
  const userStateService = inject(UserStateService);

  // Check if user is verified (returns true if verified = 1, false if verified = 0)
  return userStateService.isUserVerified();
};
