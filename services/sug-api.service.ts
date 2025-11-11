import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SugApiClient } from '@lumaverse/sug-ui';
import { ApiRequestOptions, PaginatedResponse } from './interfaces';
import { environment } from '@environments/environment';
import { HttpErrorResponse } from '@angular/common/http';

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

  private readonly HTTP_ERRORS: { [statusCode: number]: { details: string } } =
    {
      401: {
        details: 'You are no longer logged in. Please log in and try again.',
      },
      403: {
        details:
          'Your permissions do not allow this request. Please ensure you are logged in to the correct account.',
      },
      404: {
        details: 'The requested resource could not be found.',
      },
      429: {
        details:
          'You have exceeded the allowed rate limit. Please wait a few moments and try again.',
      },
      500: {
        details:
          "Something went wrong on our end. Please try again or <a href='/help' target='_blank'><strong>contact support</strong></a>.",
      },
    };

  setErrorMessage(error: HttpErrorResponse): string | undefined {
    if (!error) {
      return;
    }
    if (error.error instanceof ErrorEvent) {
      return `An error occurred: ${error.error.message}`;
    }
    if (error.status) {
      return this.HTTP_ERRORS[error?.status].details;
    }
    return `An error occurred: ${error.message}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorToSUGClientSignal = (error: any) => {
    return of({
      error: this.setErrorMessage(error),
      value: undefined,
      isLoading: false,
      pagination: undefined,
    });
  };
}
