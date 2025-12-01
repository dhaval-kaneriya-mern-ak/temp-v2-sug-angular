import { inject, Injectable } from '@angular/core';
import {
  IMemberInfoData,
  ISignUpListResponse,
  IGroupListResponse,
  IGroupMembersResponse,
  ISubAdminsResponse,
  IDateSlotsResponse,
  IDateSlotsRequest,
  IGroupMembersListResponse,
  IMessagePreviewResponse,
  IMessagePreviewRequest,
  ICreateMessageRequest,
  ICreateMessageResponse,
} from '@services/interfaces';
import {
  IMemberIndexPageResponse,
  IAllGroupsWithMembersResponse,
  IParentFolderResponse,
  IPortalSignupResponse,
  IShortUrlResponse,
} from '@services/interfaces/messages-interface/compose.interface';
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

  getTabGroups(): Observable<unknown> {
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

  getGroupsMembers(
    groupId: string | undefined
  ): Observable<IGroupMembersListResponse> {
    return this.sugApiClient.get(`/groups/${groupId}/members`);
  }

  addMembersToGroup(groupId: string, body: unknown): Observable<unknown> {
    return this.sugApiClient.post(`/groups/${groupId}/members/create`, body);
  }

  deleteMembersFromGroup(
    groupId: string,
    memberIds: number[]
  ): Observable<unknown> {
    return this.sugApiClient.patch(
      `/groups/${groupId}/members/remove-members`,
      {
        memberslist: memberIds,
      }
    );
  }

  updateGroupTitle(groupId: string, title: string): Observable<unknown> {
    return this.sugApiClient.patch(`/groups/${groupId}`, {
      title: title,
    });
  }

  createMessage(
    payload: ICreateMessageRequest
  ): Observable<ICreateMessageResponse> {
    return this.sugApiClient.post(`/messages`, payload);
  }

  messagePreview(
    payload: IMessagePreviewRequest
  ): Observable<IMessagePreviewResponse> {
    return this.sugApiClient.post(`/messages/preview`, payload);
  }

  getPortalSignup(): Observable<IPortalSignupResponse> {
    return this.sugApiClient.get(`/portals?includeTheme=true`);
  }

  getMemberIndexPage(id: string): Observable<IMemberIndexPageResponse> {
    return this.sugApiClient.get(`/member/indexpage/${id}`);
  }

  getAllGroupsWithMembers(): Observable<IAllGroupsWithMembersResponse> {
    return this.sugApiClient.get(`/groups/members/all`);
  }

  getParentFolderData(): Observable<IParentFolderResponse> {
    return this.sugApiClient.get(`/geniusdrive/parent-folder`);
  }

  getFolderContents(folderId: number): Observable<IParentFolderResponse> {
    return this.sugApiClient.get(`/geniusdrive/folder/${folderId}`);
  }

  getShortUrl(urlPath: string): Observable<IShortUrlResponse> {
    return this.sugApiClient.get(`/signups/shorturl?urlpath=${urlPath}`);
  }
}
