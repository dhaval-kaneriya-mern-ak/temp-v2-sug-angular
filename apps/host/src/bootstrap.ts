import { bootstrapApplication, Title } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

bootstrapApplication(App, appConfig)
  .then((appRef) => {
    const router = appRef.injector.get(Router);
    const titleService = appRef.injector.get(Title);

    router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const routeWithTitle = findRouteWithTitle(router.routerState.root);
        const title =
          routeWithTitle?.snapshot?.data?.['title'] || 'Default Title';

        titleService.setTitle(title);
      });
  })
  .catch((err) => console.error(err));

function findRouteWithTitle(route: ActivatedRoute): ActivatedRoute | null {
  let current: ActivatedRoute | null = route;

  while (current) {
    if (current.snapshot?.data?.['title']) {
      return current;
    }

    current = current.firstChild ?? null;
  }

  return null;
}
