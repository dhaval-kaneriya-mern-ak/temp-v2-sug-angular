import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SugUiTableComponent, ISugTableColumn } from '@lumaverse/sug-ui';

@Component({
  selector: 'app-groups-transfer',
  standalone: true,
  imports: [CommonModule, SugUiTableComponent],
  templateUrl: './groups-transfer.html',
  styleUrl: './groups-transfer.scss',
})
export class GroupsTransferComponent {
  tableData = [
    { id: 1, name: 'Development Team', owner: 'Alice' },
    { id: 2, name: 'Marketing Team', owner: 'Bob' },
    { id: 3, name: 'Sales Team', owner: 'Charlie' },
  ];

  tableColumns: ISugTableColumn[] = [
    { field: 'id', header: 'ID', sortable: true },
    { field: 'name', header: 'Group Name', sortable: true },
    { field: 'owner', header: 'Current Owner', sortable: true },
  ];
}
