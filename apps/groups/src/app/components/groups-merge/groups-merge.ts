import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SugUiTableComponent, ISugTableColumn } from '@lumaverse/sug-ui';

@Component({
  selector: 'app-groups-merge',
  standalone: true,
  imports: [CommonModule, SugUiTableComponent],
  templateUrl: './groups-merge.html',
  styleUrl: './groups-merge.scss',
})
export class GroupsMergeComponent {
  tableData = [
    { id: 1, name: 'Development Team', members: 12 },
    { id: 2, name: 'Marketing Team', members: 8 },
    { id: 3, name: 'Sales Team', members: 15 },
    { id: 4, name: 'HR Team', members: 5 },
  ];

  tableColumns: ISugTableColumn[] = [
    { field: 'id', header: 'ID', sortable: true },
    { field: 'name', header: 'Group Name', sortable: true },
    { field: 'members', header: 'Member Count', sortable: true },
  ];
}
