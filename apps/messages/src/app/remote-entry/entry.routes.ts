import { Route } from '@angular/router';
import { Dashboard } from '../components/dashboard/dashboard';
// Update the import path to match the actual file location and filename
import { TabLayoutComponent } from '../components/tablayout/tablayout';
import { Compose } from '../components/compose/compose';
import { Draft } from '../components/draft/draft';
import { Schedule } from '../components/schedule/schedule';
import { Sent } from '../components/sent/sent';
import { ComposeEmailComponent } from '../components/compose/compose_email/compose-email';
import { ComposeEmailTemplateComponent } from '../components/compose/compose_email_template/compose-email-template';
import { ComposeTextMessageComponent } from '../components/compose/compose_text_message/compose-text-message';

export const remoteRoutes: Route[] = [
  {
    path: '',
    component: TabLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      {
        path: 'compose',
        component: Compose, // ComposeComponent is now a layout for its own tabs
        children: [
          // Define the nested routes for the inner tabs
          { path: '', redirectTo: 'email', pathMatch: 'full' }, // Default to the email tab
          { path: 'email', component: ComposeEmailComponent },
          { path: 'template', component: ComposeEmailTemplateComponent },
          { path: 'text', component: ComposeTextMessageComponent },
        ],
      },
      { path: 'draft', component: Draft },
      { path: 'schedule', component: Schedule },
      { path: 'sent', component: Sent },
    ],
  },
];
