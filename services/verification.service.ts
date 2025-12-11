import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SugApiService } from './sug-api.service';

/**
 * Interface for verification details API response
 */
export interface IVerificationDetailsResponse {
  success: boolean;
  message: string[];
  data: {
    isfeatureenabled: boolean;
    isfullmember: number;
    verified: number; // 0 = not verified, 1 = verified
    haspword: boolean;
    isfullandverified: boolean;
  };
}

/**
 * Service to handle user verification operations
 * Manages verification status checks and code verification flow
 */
@Injectable({
  providedIn: 'root',
})
export class VerificationService {
  private readonly sugApiService = inject(SugApiService);

  /**
   * Check user verification status
   * GET: v3/member/verificationdetails
   * @returns Observable with verification status (0 or 1)
   */
  checkVerificationStatus(): Observable<number> {
    return this.sugApiService
      .get<IVerificationDetailsResponse>('/member/verificationdetails')
      .pipe(
        map((response: IVerificationDetailsResponse) => {
          if (response.success && response.data) {
            return response.data.verified;
          }
          return 0; // Default to not verified on error
        })
      );
  }

  /**
   * Send verification code to user's email
   * GET: /member/sendverificationcode
   * @returns Observable with API response
   */
  sendVerificationCode(): Observable<any> {
    return this.sugApiService.get<any>('/member/sendverificationcode');
  }

  /**
   * Validate member verification code
   * POST: v3/member/validatememberverificationcode
   * @param code - 6-digit verification code
   * @returns Observable with validation result
   */
  validateVerificationCode(code: string): Observable<any> {
    const payload = { code };
    return this.sugApiService.post<any>(
      '/member/validatememberverificationcode',
      payload
    );
  }
}
