import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { SugApiService } from '@services/sug-api.service';
import { Observable } from 'rxjs';

/**
 * Interface for group response from API
 */
export interface IGroup {
  id: number;
  title: string;
  membercount: number;
  signupcount: number;
}
export interface IPaginationResponse {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Interface for groups list API response
 */
export interface IGroupListApiResponse {
  success: boolean;
  data: IGroup[];
  pagination: IPaginationResponse;
  message?: string[];
}
interface CreateGroupPayload {
  title: string; // your API expects "title" instead of "name"
}

/**
 * Groups Service
 * Handles API calls for group-related operations
 */
@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  // Inject SugApiService to make the API calls
  private sugApiClient = inject(SugApiService);
  getAllGroupsPaginated(
    page: number,
    limit: number,
    sortby: string,
    sort: string,
    search: string
  ): Observable<IGroupListApiResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortby', sortby)
      .set('sort', sort)
      .set('search', search || '');

    return this.sugApiClient.get<IGroupListApiResponse>('/groups', { params });
  }

  createGroup(payload: CreateGroupPayload): Observable<any> {
    return this.sugApiClient.post<any>('/groups', payload);
  }
  deleteGroup(groupId: number) {
    return this.sugApiClient.delete(`/groups/${groupId}`);
  }
}
