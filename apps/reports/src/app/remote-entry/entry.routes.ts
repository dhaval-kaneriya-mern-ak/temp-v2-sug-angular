import { Route } from '@angular/router';
import { Signup } from '../components/signup/signup';
import { State } from '../components/state/state';
import { Volunteers } from '../components/volunteers/volunteers';
import { Payment } from '../components/payment/payment';

export const remoteRoutes: Route[] = [
  { path: '', redirectTo: 'signup', pathMatch: 'full' },
  { path: 'signup', component: Signup },
  { path: 'state', component: State },
  { path: 'volunteers', component: Volunteers },
  { path: 'payment', component: Payment },
];
