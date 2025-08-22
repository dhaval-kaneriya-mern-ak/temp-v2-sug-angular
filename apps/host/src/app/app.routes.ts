import { HomeComponent } from './components/home.component';
import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'messages',
    loadChildren: () => import('messages/Routes').then((m) => m.remoteRoutes),
  },
  {
    path: 'reports',
    loadChildren: () => import('reports/Routes').then((m) => m.remoteRoutes),
  },
  {
    path: '',
    component: HomeComponent,
  },
];
