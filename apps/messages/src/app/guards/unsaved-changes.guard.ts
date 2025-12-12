import { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';

/**
 * Interface that components must implement to use the unsaved changes guard
 */
export interface ComponentCanDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
}

/**
 * Route guard to prevent navigation when there are unsaved changes
 * Shows confirmation dialog before allowing user to leave the page
 */
export const unsavedChangesGuard: CanDeactivateFn<ComponentCanDeactivate> = (
  component: ComponentCanDeactivate
) => {
  // If component implements canDeactivate, call it
  if (component && typeof component.canDeactivate === 'function') {
    return component.canDeactivate();
  }
  // Otherwise, allow deactivation
  return true;
};
