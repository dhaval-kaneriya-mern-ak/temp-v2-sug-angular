import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SugApiService } from '@services/sug-api.service';

export interface GroupMembersParams {
  page: number;
  limit: number;
  sortby: string;
  sort: string;
  search: string;
}

export interface GroupData {
  members: GroupMember[];
  id: number;
  title: string;
}
export interface Pagination {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
export interface Links {
  next?: string;
  self: string;
  previous?: string;
}
export interface GroupMembersResponse {
  success: boolean;
  message: string;
  data: GroupData;
  pagination: Pagination;
  links: Links;
}

export interface GroupMember {
  isgroupemail: boolean;
  textoptin: boolean;
  id: number;
  communitymemberid: number;
  firstname: string;
  lastname: string;
  email: string;
  profilepicdata?: string;
}

@Injectable({ providedIn: 'root' })
export class GroupEditService {
  private sugApiClient = inject(SugApiService);

  getGroupMembers(groupId: number, params: GroupMembersParams) {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString())
      .set('sortby', params.sortby)
      .set('sort', params.sort.toLowerCase());

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.sugApiClient.get<GroupMembersResponse>(
      `/groups/${groupId}/members`,
      { params: httpParams }
    );
  }

  deleteGroupMember(groupId: number, memberId: number) {
    return this.sugApiClient.delete(`/groups/${groupId}/members/${memberId}`);
  }
}
