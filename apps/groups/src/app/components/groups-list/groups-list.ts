import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SugUiTableComponent, ISugTableColumn } from '@lumaverse/sug-ui';

@Component({
  selector: 'app-groups-list',
  standalone: true,
  imports: [CommonModule, SugUiTableComponent],
  templateUrl: './groups-list.html',
  styleUrl: './groups-list.scss',
})
export class GroupsListComponent {
  tableData = [
    { id: 1, name: 'Development Team', memberCount: 12, status: 'Active' },
    { id: 2, name: 'Marketing Team', memberCount: 8, status: 'Active' },
    { id: 3, name: 'Sales Team', memberCount: 15, status: 'Inactive' },
    { id: 4, name: 'HR Team', memberCount: 5, status: 'Active' },
  ];

  tableColumns: ISugTableColumn[] = [
    { field: 'id', header: 'ID', sortable: true },
    { field: 'name', header: 'Group Name', sortable: true },
    { field: 'memberCount', header: 'Members', sortable: true },
    { field: 'status', header: 'Status', sortable: true },
  ];
}
