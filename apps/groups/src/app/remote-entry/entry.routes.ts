import { Route } from '@angular/router';
import { GroupsListComponent } from '../components/groups-list/groups-list';
import { GroupsEditComponent } from '../components/groups-edit/groups-edit';
import { GroupsExportComponent } from '../components/groups-export/groups-export';
import { GroupsTransferComponent } from '../components/groups-transfer/groups-transfer';
import { GroupsMergeComponent } from '../components/groups-merge/groups-merge';

export const remoteRoutes: Route[] = [
  { path: '', component: GroupsListComponent },
  { path: 'edit/:groupid', component: GroupsEditComponent },
  { path: 'export', component: GroupsExportComponent },
  { path: 'transfer', component: GroupsTransferComponent },
  { path: 'merge', component: GroupsMergeComponent },
];
