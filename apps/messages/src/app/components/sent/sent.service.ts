import { inject, Injectable } from '@angular/core';
import { ApiResponse } from '@lumaverse/sug-ui';
import { SentMessagesResponse } from '@services/interfaces';
import { SugApiService } from '@services/sug-api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SentService {
  private sugApiClient = inject(SugApiService);

  /**
   * Get message sent with pagination
   */
  getMessageSentWithPagination(
    messagetype = 0,
    page: number,
    limit: number,
    sortby = 'senddate',
    sort = 'desc'
  ): Observable<SentMessagesResponse> {
    return this.sugApiClient.get(
      `messages/sent?page=${page}&limit=${limit}&sortby=${sortby}&sort=${sort}`
    );
  }
}
