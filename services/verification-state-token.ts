import { InjectionToken } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface VerificationState {
  isVerified: boolean;
  isApiFailed: boolean;
}

export const VERIFICATION_STATE_SUBJECT = new InjectionToken<
  BehaviorSubject<VerificationState>
>('VERIFICATION_STATE_SUBJECT', {
  providedIn: 'root',
  factory: () => {
    if (typeof window !== 'undefined') {
      if (!window.__SUG_VERIFICATION_STATE_SUBJECT__) {
        window.__SUG_VERIFICATION_STATE_SUBJECT__ =
          new BehaviorSubject<VerificationState>({
            isVerified: false,
            isApiFailed: false,
          });
      }
      return window.__SUG_VERIFICATION_STATE_SUBJECT__;
    }
    // Fallback for SSR or testing
    return new BehaviorSubject<VerificationState>({
      isVerified: false,
      isApiFailed: false,
    });
  },
});

declare global {
  interface Window {
    __SUG_VERIFICATION_STATE_SUBJECT__?: BehaviorSubject<VerificationState>;
  }
}
