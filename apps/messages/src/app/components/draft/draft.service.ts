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
  getMessageTemplates(): Observable<DraftMessagesResponse> {
    return this.sugApiClient.get(`/messages/templates`);
  }
}
