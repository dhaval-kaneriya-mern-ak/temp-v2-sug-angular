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
    sortby = 'created',
    sort = 'desc'
  ): Observable<DraftMessagesResponse> {
    return this.sugApiClient.get(
      `/messages/templates?page=${page}&limit=${limit}&sortby=${sortby}&sort=${sort}`
    );
  }
}
