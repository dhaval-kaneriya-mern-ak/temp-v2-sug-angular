import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SugApiService } from './sug-api.service';
import { UserStateService } from './user-state.service';

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

export interface ISendVerificationCodeResponse {
  success: boolean;
  message: string[];
  data: {
    success: boolean;
  };
}

export interface IValidateVerificationCodeResponse {
  success: boolean;
  message: string[];
  data: {
    success: boolean;
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
  private readonly userStateService = inject(UserStateService);
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
            this.userStateService.setVerifyApiFailed(false);
            return response.data.verified;
          } else if (!response.success) {
            this.userStateService.setVerifyApiFailed(true);
            return 0;
          }
          return 0;
        })
      );
  }

  /**
   * Send verification code to user's email
   * GET: /member/sendverificationcode
   * @returns Observable with API response
   */
  sendVerificationCode(): Observable<ISendVerificationCodeResponse> {
    return this.sugApiService.get<ISendVerificationCodeResponse>(
      '/member/sendverificationcode'
    );
  }

  /**
   * Validate member verification code
   * POST: v3/member/validatememberverificationcode
   * @param code - 6-digit verification code
   * @returns Observable with validation result
   */
  validateVerificationCode(
    code: string
  ): Observable<IValidateVerificationCodeResponse> {
    const payload = { code };
    return this.sugApiService.post<IValidateVerificationCodeResponse>(
      '/member/validatememberverificationcode',
      payload
    );
  }
}
