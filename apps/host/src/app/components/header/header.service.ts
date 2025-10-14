import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// import { SugApiService } from '@apps/host/src/app/services/sug-api.service';
import { SugApiService } from '@services/sug-api.service';
import { ApiResponse, MemberProfile, UserRole } from '@services/interfaces';

@Injectable({
  providedIn: 'root',
})
export class HeaderService {
  private sugApiClient = inject(SugApiService);

  /**
   * Get user profile
   */
  getUserProfile(): Observable<ApiResponse<MemberProfile>> {
    return this.sugApiClient.get('/member/profile');
  }
  /**
   * Get user role
   */
  getUserRole(): Observable<ApiResponse<UserRole[]>> {
    return this.sugApiClient.get('/auth/roles');
  }
}
