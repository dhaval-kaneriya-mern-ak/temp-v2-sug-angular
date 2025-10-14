import { inject, Injectable } from '@angular/core';
import { MessageDetailsResponse } from '@services/interfaces';
import { SugApiService } from '@services/sug-api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MessageDetailsService {
  private sugApiClient = inject(SugApiService);

  /**
   * Get message details
   */
  getMessageDetails(messageId: number): Observable<MessageDetailsResponse> {
    return this.sugApiClient.get(`messages/sent/${messageId}`);
  }
}
