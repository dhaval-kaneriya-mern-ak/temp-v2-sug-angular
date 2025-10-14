import { inject, Injectable } from '@angular/core';
import { ApiResponse } from '@lumaverse/sug-ui';
import { MessageApiResponse, MessagesListResponse } from '@services/interfaces';
import { SugApiService } from '@services/sug-api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  private sugApiClient = inject(SugApiService);

  getScheduleMessageList(
    messagetype = 0,
    page = 1,
    limit = 10,
    sortby = 'datecreated',
    sort = 'desc'
  ): Observable<MessageApiResponse> {
    return this.sugApiClient.get(
      `messages/scheduled?messagetype=${messagetype}&page=${page}&limit=${limit}&sortby=${sortby}&sort=${sort}`
    );
  }

  deleteScheduleMessage(messageId: number): Observable<any> {
    return this.sugApiClient.delete(`messages/scheduled/${messageId}`);
  }
}
