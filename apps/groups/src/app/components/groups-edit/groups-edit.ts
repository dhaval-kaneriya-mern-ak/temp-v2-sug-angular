import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SugUiTableComponent, ISugTableColumn } from '@lumaverse/sug-ui';

@Component({
  selector: 'app-groups-edit',
  standalone: true,
  imports: [CommonModule, SugUiTableComponent],
  templateUrl: './groups-edit.html',
  styleUrl: './groups-edit.scss',
})
export class GroupsEditComponent {
  private route = inject(ActivatedRoute);
  groupId = this.route.snapshot.paramMap.get('groupid');

  tableData = [
    { id: 101, name: 'John Doe', role: 'Admin', email: 'john@example.com' },
    { id: 102, name: 'Jane Smith', role: 'Member', email: 'jane@example.com' },
    { id: 103, name: 'Bob Johnson', role: 'Member', email: 'bob@example.com' },
  ];

  tableColumns: ISugTableColumn[] = [
    { field: 'id', header: 'Member ID', sortable: true },
    { field: 'name', header: 'Name', sortable: true },
    { field: 'email', header: 'Email', sortable: true },
    { field: 'role', header: 'Role', sortable: true },
  ];
}
