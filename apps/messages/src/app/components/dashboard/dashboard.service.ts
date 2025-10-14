import { inject, Injectable } from '@angular/core';
import { ApiResponse } from '@lumaverse/sug-ui';
import {
  MessageLimitsResponse,
  MessagesListResponse,
} from '@services/interfaces';
import { SugApiService } from '@services/sug-api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private sugApiClient = inject(SugApiService);

  /**
   * Get message limits
   */
  getMessageLimits(): Observable<ApiResponse<MessageLimitsResponse>> {
    return this.sugApiClient.get('messages/memberlimits');
  }
  /**
   * Get message summary
   */
  getMessageSummary(): Observable<ApiResponse<MessagesListResponse[]>> {
    return this.sugApiClient.get('messages/summary');
  }
}
