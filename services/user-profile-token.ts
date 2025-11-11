import { InjectionToken } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MemberProfile } from './interfaces';

/**
 * Injection token for shared user profile subject across module federation
 * This creates a single shared instance that works across host and remote apps
 */
export const USER_PROFILE_SUBJECT = new InjectionToken<
  BehaviorSubject<MemberProfile | null>
>('USER_PROFILE_SUBJECT', {
  providedIn: 'root',
  factory: () => {
    // Store in window to share across module federation boundaries
    if (typeof window !== 'undefined') {
      if (!window.__SUG_USER_PROFILE_SUBJECT__) {
        window.__SUG_USER_PROFILE_SUBJECT__ =
          new BehaviorSubject<MemberProfile | null>(null);
      }
      return window.__SUG_USER_PROFILE_SUBJECT__;
    }
    // Fallback for SSR or testing
    return new BehaviorSubject<MemberProfile | null>(null);
  },
});

// Extend Window interface for TypeScript
declare global {
  interface Window {
    __SUG_USER_PROFILE_SUBJECT__?: BehaviorSubject<MemberProfile | null>;
  }
}
