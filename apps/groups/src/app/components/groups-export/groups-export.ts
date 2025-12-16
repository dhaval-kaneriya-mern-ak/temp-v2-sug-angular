import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SugUiTableComponent, ISugTableColumn } from '@lumaverse/sug-ui';

@Component({
  selector: 'app-groups-export',
  standalone: true,
  imports: [CommonModule, SugUiTableComponent],
  templateUrl: './groups-export.html',
  styleUrl: './groups-export.scss',
})
export class GroupsExportComponent {
  tableData = [
    { id: 1, name: 'Development Team', lastExport: '2023-01-01' },
    { id: 2, name: 'Marketing Team', lastExport: '2023-02-15' },
    { id: 3, name: 'Sales Team', lastExport: 'Never' },
  ];

  tableColumns: ISugTableColumn[] = [
    { field: 'id', header: 'ID', sortable: true },
    { field: 'name', header: 'Group Name', sortable: true },
    { field: 'lastExport', header: 'Last Exported', sortable: true },
  ];
}
