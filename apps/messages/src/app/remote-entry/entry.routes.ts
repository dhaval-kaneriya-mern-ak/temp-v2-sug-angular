import { Route } from '@angular/router';
import { Dashboard } from '../components/dashboard/dashboard';
// Update the import path to match the actual file location and filename
import { TabLayoutComponent } from '../components/tablayout/tablayout';
import { Compose } from '../components/compose/compose';
import { Draft } from '../components/draft/draft';
import { Schedule } from '../components/schedule/schedule';
import { Sent } from '../components/sent/sent';
import { MessageDetailsComponent } from '../components/sent/message_details/message_details';
import { MessageAnalyticsComponent } from '../components/sent/message_analytics/message_analytics';
import { ComposeEmailComponent } from '../components/compose/compose_email/compose-email';
import { ComposeEmailTemplateComponent } from '../components/compose/compose_email_template/compose-email-template';
import { ComposeTextMessageComponent } from '../components/compose/compose_text_message/compose-text-message';
import { SentDetails } from '../components/sent/details/sent-details';
import { scheduleGuard } from '../guards/schedule.guard';
import { unsavedChangesGuard } from '../guards/unsaved-changes.guard';
import { verificationGuard } from '@services/guards/verification.guard';

export const remoteRoutes: Route[] = [
  {
    path: '',
    component: TabLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      {
        path: 'compose',
        canActivate: [verificationGuard],
        component: Compose, // ComposeComponent is now a layout for its own tabs
        children: [
          // Define the nested routes for the inner tabs
          { path: '', redirectTo: 'email', pathMatch: 'full' }, // Default to the email tab
          {
            path: 'email',
            component: ComposeEmailComponent,
            canDeactivate: [unsavedChangesGuard],
          },
          {
            path: 'template',
            component: ComposeEmailTemplateComponent,
            canDeactivate: [unsavedChangesGuard],
          },
          {
            path: 'text',
            component: ComposeTextMessageComponent,
            canDeactivate: [unsavedChangesGuard],
          },
        ],
      },
      { path: 'draft', component: Draft },
      {
        path: 'schedule',
        component: Schedule,
        canActivate: [scheduleGuard],
      },
      { path: 'sent', component: Sent },
      {
        path: 'sent/:id',
        component: SentDetails,
        children: [
          // Define the nested routes for the inner tabs
          { path: '', redirectTo: 'details', pathMatch: 'full' },
          { path: 'details', component: MessageDetailsComponent },
          {
            path: 'analytics',
            component: MessageAnalyticsComponent,
          },
        ],
      },
    ],
  },
];
