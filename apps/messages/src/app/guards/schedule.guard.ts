import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserStateService } from '@services/user-state.service';
import { map, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Enhanced route guard to protect schedule page based on subscription level
 * Allows access only for trial users or gold/platinum/enterprise subscribers
 */
export const scheduleGuard: CanActivateFn = () => {
  const userStateService = inject(UserStateService);
  const router = inject(Router);

  // Use the enhanced access check method
  return userStateService.checkScheduleAccess().pipe(
    take(1),
    map((hasAccess) => {
      if (!hasAccess) {
        router.navigate(['/messages/dashboard']);
        return false;
      }
      return true;
    }),
    catchError(() => {
      // On any error, deny access and redirect
      router.navigate(['/messages/dashboard']);
      return of(false);
    })
  );
};
