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
  IFileDetailsResponse,
  SendToType,
  SentTo,
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

  getSignUpList(options?: {
    includeAdvanceDetails?: boolean;
  }): Observable<ISignUpListResponse> {
    const params = new URLSearchParams({
      page: '1',
      limit: '100',
      sortBy: 'startdate',
      sortOrder: 'desc',
      filter: 'active',
    });

    if (options?.includeAdvanceDetails) {
      params.append('includeAdvanceDetails', 'true');
    }

    return this.sugApiClient.get(`/signups/created?${params.toString()}`);
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
    slotItemIds?: number[];
    filters: {
      p_page: number;
      p_limit: number;
      p_sortBy?: string;
    };
  }): Observable<IGroupMembersResponse> {
    return this.sugApiClient.post(`/messages/recipients`, payload);
  }

  /**
   * Generalized function to fetch recipients for any scenario
   * Determines which parameters to send based on sentToType and sentTo
   *
   * @param options - Configuration object
   * @param options.sentToType - The type of recipient selection (e.g., 'signedup', 'peopleingroups', 'manual')
   * @param options.sentTo - The specific recipient group (e.g., 'signedup', 'notsignedup', 'all')
   * @param options.messageTypeId - The message type ID (1, 4, 14, or 15)
   * @param options.signupIds - Optional array of signup IDs
   * @param options.slotItemIds - Optional array of slot item IDs (for specific date slots)
   * @param options.groupIds - Optional array of group IDs
   * @param options.filters - Optional pagination filters (defaults to page 1, limit 1000, sortBy displayname)
   * @returns Observable of recipient data
   */
  fetchRecipients(options: {
    sentToType: string;
    sentTo: string;
    messageTypeId: number;
    signupIds?: number[];
    slotItemIds?: number[];
    groupIds?: number[];
    filters?: {
      p_page: number;
      p_limit: number;
      p_sortBy?: string;
    };
  }): Observable<IGroupMembersResponse> {
    const sentToTypeLower = options.sentToType?.toLowerCase() || '';
    const sentToLower = options.sentTo?.toLowerCase() || '';

    const payload: {
      sentToType: string;
      sentTo: string;
      messageTypeId: number;
      groupIds?: number[];
      signupIds?: number[];
      slotItemIds?: number[];
      filters: {
        p_page: number;
        p_limit: number;
        p_sortBy?: string;
      };
    } = {
      sentToType: options.sentToType,
      sentTo: options.sentTo,
      messageTypeId: options.messageTypeId,
      slotItemIds: options.slotItemIds,
      filters: options.filters || {
        p_page: 1,
        p_limit: 1000,
        p_sortBy: 'displayname',
      },
    };

    if (
      sentToTypeLower === SendToType.SIGNED_UP &&
      sentToLower === SentTo.SIGNED_UP
    ) {
      if (options.signupIds && options.signupIds.length > 0) {
        payload.signupIds = options.signupIds;
      }
    } else if (
      sentToTypeLower === SendToType.PEOPLE_IN_GROUPS &&
      sentToLower === SentTo.NOT_SIGNED_UP
    ) {
      if (options.signupIds && options.signupIds.length > 0) {
        payload.signupIds = options.signupIds;
      }
    } else if (
      sentToTypeLower === SendToType.PEOPLE_IN_GROUPS &&
      sentToLower === SentTo.ALL
    ) {
      if (options.groupIds && options.groupIds.length > 0) {
        payload.groupIds = options.groupIds;
      }
    } else if (
      sentToTypeLower === SendToType.PEOPLE_IN_GROUPS &&
      sentToLower === SentTo.INCLUDE_NON_GROUP_MEMBERS
    ) {
      if (options.groupIds && options.groupIds.length > 0) {
        payload.groupIds = options.groupIds;
      }
      if (options.signupIds && options.signupIds.length > 0) {
        payload.signupIds = options.signupIds;
      }
    } else if (sentToTypeLower === SendToType.WAITLIST) {
      if (options.signupIds && options.signupIds.length > 0) {
        payload.signupIds = options.signupIds;
      }
    } else if (sentToTypeLower === SendToType.SIGNUP_WAITLIST) {
      if (options.signupIds && options.signupIds.length > 0) {
        payload.signupIds = options.signupIds;
      }
    } else if (sentToTypeLower === SendToType.SPECIFIC_RSVP) {
      if (options.signupIds && options.signupIds.length > 0) {
        payload.signupIds = options.signupIds;
      }
      if (options.groupIds && options.groupIds.length > 0) {
        payload.groupIds = options.groupIds;
      }
    } else if (sentToTypeLower === SendToType.SPECIFIC_DATE_SLOT) {
      if (options.signupIds && options.signupIds.length > 0) {
        payload.signupIds = options.signupIds;
        payload.slotItemIds = options.slotItemIds;
      }
    } else {
      if (options.signupIds && options.signupIds.length > 0) {
        payload.signupIds = options.signupIds;
      }
      if (options.groupIds && options.groupIds.length > 0) {
        payload.groupIds = options.groupIds;
      }
    }

    return this.getGroupMembers(payload);
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

  getMessageById(id: number): Observable<any> {
    return this.sugApiClient.get(`/messages/${id}`);
  }

  /**
   * Save/Update draft message
   * @param id - The message ID to update
   * @param payload - The message data payload
   * @returns Observable of the API response
   */
  saveDraftMessage(id: number, payload: any): Observable<any> {
    return this.sugApiClient.patch(`/messages/${id}`, payload);
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

  /**
   * Get file details from GeniusDrive
   * Fetches metadata including filename, file URL, size, and description
   * @param fileId - The file ID to get details for
   * @returns Observable of file details response containing filename, s3Presignedurl, filesizekb, and filedescription
   * @throws Error if file not found or access denied
   * @example
   * this.getFileDetails(123).subscribe(response => {
   *   if (response.success) {
   *     console.log(response.data.filename);
   *   }
   * });
   */
  getFileDetails(fileId: number): Observable<IFileDetailsResponse> {
    return this.sugApiClient.get<IFileDetailsResponse>(
      `/geniusdrive/file/${fileId}/details`
    );
  }
}
