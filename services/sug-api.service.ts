import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SugApiClient } from '@lumaverse/sug-ui';
import { ApiRequestOptions, PaginatedResponse } from './interfaces';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SugApiService {
  private sugApiClient = inject(SugApiClient);

  createSugApiClient(baseUrl: string = environment.apiBaseUrl): void {
    this.sugApiClient.configure({
      baseUrl: baseUrl,
      withCredentials: true,
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
    });
  }
  // Generic HTTP methods

  /**
   * Generic GET request
   */
  get<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    return this.sugApiClient.get<T>(endpoint, options);
  }

  /**
   * Generic POST request
   */
  post<T>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Observable<T> {
    return this.sugApiClient.post<T>(endpoint, body, options);
  }

  /**
   * Generic PUT request
   */
  put<T>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Observable<T> {
    return this.sugApiClient.put<T>(endpoint, body, options);
  }

  /**
   * Generic PATCH request
   */
  patch<T>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Observable<T> {
    return this.sugApiClient.patch<T>(endpoint, body, options);
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    return this.sugApiClient.delete<T>(endpoint, options);
  }

  // Paginated requests

  /**
   * Get paginated data
   */
  getPaginated<T>(
    endpoint: string,
    page = 1,
    limit = 10,
    options?: ApiRequestOptions
  ): Observable<PaginatedResponse<T>> {
    return this.sugApiClient.getPaginated<PaginatedResponse<T>>(
      endpoint,
      page,
      limit,
      options
    );
  }

  // File operations

  /**
   * Upload a file
   */
  uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string | number | boolean>,
    options?: ApiRequestOptions
  ): Observable<T> {
    return this.sugApiClient.uploadFile<T>(
      endpoint,
      file,
      additionalData,
      options
    );
  }

  /**
   * Download a file
   */
  downloadFile(
    endpoint: string,
    fileName?: string,
    options?: ApiRequestOptions
  ): Observable<Blob> {
    return this.sugApiClient.downloadFile(endpoint, fileName, options);
  }

  // Handle response transformation
  /**
   * Transform response data with custom transformer
   */
  transformResponse<T, R>(
    response: Observable<T>,
    transformer: (data: T) => R
  ): Observable<R> {
    return this.sugApiClient.handleResponse(response, transformer);
  }
}
