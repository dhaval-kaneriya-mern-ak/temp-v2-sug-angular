// import { HomeComponent } from './components/home.component';
import { Route } from '@angular/router';
import { AdUnitsConfig } from '@services/freestar.service';

export const appRoutes: Route[] = [
  {
    path: 'groups',
    loadChildren: () => import('groups/Routes').then((m) => m!.remoteRoutes),
  },
  {
    path: 'messages',
    loadChildren: () => import('messages/Routes').then((m) => m.remoteRoutes),
    data: {
      title: 'Message Center',
      showAds: true,
      adUnits: {
        desktop: {
          top: 'signupgenius_Desktop_Members_Messages_728x90_Top',
          bottom: 'signupgenius_Desktop_Members_Messages_728x90_Bot',
          right: 'signupgenius_Desktop_Members_Messages_300x600_Right',
        },
        mobile: {
          top: 'signupgenius_Mobile_Members_Messages_320x50_Top',
          // No bottom ad for messages menu on mobile
        },
      } as AdUnitsConfig,
    },
  },
  {
    path: 'reports',
    loadChildren: () => import('reports/Routes').then((m) => m.remoteRoutes),
    data: { title: 'My Reports', showAds: false }, // Set to true when ready to show ads
    // Add adUnits configuration here when ready to show ads
    // adUnits: { ... } as AdUnitsConfig,
  },
  // {
  //   path: '',
  //   component: HomeComponent,
  // },
  {
    path: '',
    redirectTo: '/messages/dashboard',
    pathMatch: 'full',
  },
];
