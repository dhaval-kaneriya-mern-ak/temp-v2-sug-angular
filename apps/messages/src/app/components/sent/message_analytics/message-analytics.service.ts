import { inject, Injectable } from '@angular/core';
import { MessageStatsResponse } from '@services/interfaces';
import { SugApiService } from '@services/sug-api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MessageAnalyticsService {
  private sugApiClient = inject(SugApiService);

  /**
   * Get message analytics
   */
  getMessageAnalytics(
    messageId: number,
    page: number,
    limit: number,
    sortby = 'senddate',
    sort = 'desc'
  ): Observable<MessageStatsResponse> {
    return this.sugApiClient.get(`/messages/sent/${messageId}/stats`, {
      params: {
        page,
        limit,
        sortby,
        sort,
      },
    });
  }
}
