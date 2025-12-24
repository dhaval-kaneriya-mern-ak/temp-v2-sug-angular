import { inject, Injectable } from '@angular/core';
import {
  MessageDetailsResponse,
  MessageDetailsData,
} from '@services/interfaces';
import { SugApiService } from '@services/sug-api.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MessageDetailsService {
  private sugApiClient = inject(SugApiService);
  private currentMessageDetails =
    new BehaviorSubject<MessageDetailsData | null>(null);

  // Expose as observable for components to subscribe
  messageDetails$ = this.currentMessageDetails.asObservable();

  /**
   * Get message details from API and store in service
   */
  getMessageDetails(messageId: number): Observable<MessageDetailsResponse> {
    // Clear previous data immediately when starting new API call
    this.currentMessageDetails.next(null);

    return this.sugApiClient
      .get<MessageDetailsResponse>(`messages/sent/${messageId}`)
      .pipe(
        tap({
          next: (response: MessageDetailsResponse) => {
            // Store the data in the service for other components to use
            this.currentMessageDetails.next(response.data);
          },
          error: () => {
            // Keep data cleared on error
            this.currentMessageDetails.next(null);
          },
        })
      );
  }

  /**
   * Get stored message details without API call
   */
  getStoredMessageDetails(): MessageDetailsData | null {
    return this.currentMessageDetails.value;
  }

  /**
   * Set message details directly (useful for parent components)
   */
  setMessageDetails(messageDetails: MessageDetailsData): void {
    this.currentMessageDetails.next(messageDetails);
  }

  /**
   * Clear stored message details
   */
  clearMessageDetails(): void {
    this.currentMessageDetails.next(null);
  }
}
