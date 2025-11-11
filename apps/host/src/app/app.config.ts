import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { SUGTheme, SugApiClient } from '@lumaverse/sug-ui';
import { environment } from '@environments/environment';
import { provideToastr } from 'ngx-toastr';

// Factory function to create configured SugApiClient
export function createSugApiClient(): SugApiClient {
  const client = new SugApiClient();
  client.configure({
    baseUrl: environment.apiBaseUrl,
    withCredentials: true,
    defaultHeaders: {
      'Content-Type': 'application/json',
    },
  });
  return client;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideAnimations(),
    provideHttpClient(),
    {
      provide: SugApiClient,
      useFactory: createSugApiClient,
    },
    providePrimeNG({
      theme: {
        preset: SUGTheme,
        options: {
          darkModeSelector: '.p-dark',
        },
      },
    }),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      closeButton: true,
      progressBar: true,
    }),
  ],
};
