import { inject, Injectable } from '@angular/core';
import {
  IMemberVerificationDetailsResponse,
  IMemberEmailLimitsResponse,
  IMemberInfoData,
  ISignUpListResponse,
  IGroupListResponse,
  IGroupMembersResponse,
  ICloudSpongeServicesResponse,
  ISubAdminsResponse,
  IGetSignUpListResponse,
  IDateSlotsResponse,
  IDateSlotsRequest,
} from '@services/interfaces';
import { SugApiService } from '@services/sug-api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ComposeService {
  private sugApiClient = inject(SugApiService);

  getMemberInfo(): Observable<IMemberInfoData> {
    return this.sugApiClient.get(`messages/compose/member-info`);
  }

  getSignUpList(): Observable<ISignUpListResponse> {
    return this.sugApiClient.get(
      `/signups/created?page=1&limit=100&sortBy=startdate&sortOrder=desc&filter=active`
    );
  }

  getGroupforMembers(): Observable<IGroupListResponse> {
    return this.sugApiClient.get(`/groups`);
  }

  getGroupMembers(payload: {
    sentToType: string;
    sentTo: string;
    messageTypeId: number;
    groupIds?: number[];
    signupIds?: number[];
    filters: {
      p_page: number;
      p_limit: number;
    };
  }): Observable<IGroupMembersResponse> {
    return this.sugApiClient.post(`/messages/recipients`, payload);
  }

  getSubAdmins(): Observable<ISubAdminsResponse> {
    return this.sugApiClient.get(`auth/subadmins`);
  }

  getTabGroups(): Observable<any> {
    return this.sugApiClient.get(
      `/tools/tabgroups?page=1&limit=100&sortBy=name&sortOrder=asc`
    );
  }

  /**
   * Get date slots for a signup
   * @param signupId - The signup ID
   * @param payload - Request payload with includeSignedUpMembers and pagination options
   * @returns Observable of IDateSlotsResponse
   */
  getDateSlots(
    signupId: number,
    payload: IDateSlotsRequest
  ): Observable<IDateSlotsResponse> {
    return this.sugApiClient.post(`/signups/${signupId}/dateslots`, payload);
  }
}
