import { inject, Injectable } from '@angular/core';
import { SugApiService } from '@services/sug-api.service';
import { Observable } from 'rxjs';
import { DraftMessagesResponse } from '@services/interfaces';

@Injectable({
  providedIn: 'root',
})
export class DraftService {
  private sugApiClient = inject(SugApiService);

  /**
   * Get message templates
   */
  getMessageTemplates(
    page: number,
    limit: number,
    sortby = 'datecreated',
    sort = 'desc',
    searchTerm = ''
  ): Observable<DraftMessagesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortby,
      sort,
      search: searchTerm,
    });
    return this.sugApiClient.get(`/messages/drafts?${params.toString()}`);
  }

  deleteDraftMessage(messageId: number): Observable<DraftMessagesResponse> {
    return this.sugApiClient.delete(`/messages/${messageId}`);
  }
}
