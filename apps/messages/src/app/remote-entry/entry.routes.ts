import { Route } from '@angular/router';
import { Dashboard } from '../components/dashboard/dashboard';
import { Compose } from '../components/compose/compose';
import { Draft } from '../components/draft/draft';
import { Schedule } from '../components/schedule/schedule';
import { Sent } from '../components/sent/sent';

export const remoteRoutes: Route[] = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'compose', component: Compose },
  { path: 'draft', component: Draft },
  { path: 'schedule', component: Schedule },
  { path: 'sent', component: Sent },
];
