import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ISugTableConfig, ISugTableColumn } from '@lumaverse/sug-ui';
import { BadgeModule } from 'primeng/badge';
import { HttpClientModule } from '@angular/common/http';
import { SugUiTableComponent, SugUiButtonComponent } from '@lumaverse/sug-ui';

@Component({
  selector: 'sug-draft',
  imports: [
    CommonModule,
    SugUiTableComponent,
    SugUiButtonComponent,
    ButtonModule,
    BadgeModule,
    HttpClientModule,
  ],
  templateUrl: './draft.html',
  styleUrl: './draft.scss',
})
export class Draft {
  tableConfig: ISugTableConfig = {};
  tableColumns: ISugTableColumn[] = [
    {
      field: 'created',
      header: 'Created',
      sortable: true,
      filterable: false,
    },
    {
      field: 'subject',
      header: 'Subject',
      sortable: true,
      filterable: false,
    },
    {
      field: 'type',
      header: 'Type',
      sortable: true,
      filterable: false,
    },
    {
      field: 'status',
      header: ' ',
      sortable: false,
      filterable: false,
    },
  ];

  tableData = [
    {
      created: '06/20/2025 10:08am',
      subject: 'test reminder',
      type: 'Custom Reminder',
      status: `<div class="table-action-wrapper">
                <a href="#" class="btn-action"><i class="pi pi-pencil"></i></a>
                <a href="#" class="btn-action"><i class="pi pi-times"></i></a>
              </div>`,
    },
    {
      created: '07/30/2025 10:26am',
      subject: 'test psql signup Invite',
      type: 'Custom Confirmation',
      status: `<div class="table-action-wrapper">
                <a href="#" class="btn-action"><i class="pi pi-pencil"></i></a>
                <a href="#" class="btn-action"><i class="pi pi-times"></i></a>
              </div>`,
    },
    {
      created: '08/19/2025 3:15am',
      subject: 'test Invite',
      type: 'Invite',
      status: `<div class="table-action-wrapper">
                <a href="#" class="btn-action"><i class="pi pi-pencil"></i></a>
                <a href="#" class="btn-action"><i class="pi pi-times"></i></a>
              </div>`,
    },
    {
      created: '08/19/2025 3:15am',
      subject: 'test Invite',
      type: 'Invite',
      status: `<div class="table-action-wrapper">
                <a href="#" class="btn-action"><i class="pi pi-pencil"></i></a>
                <a href="#" class="btn-action"><i class="pi pi-times"></i></a>
              </div>`,
    },
    {
      created: '07/30/2025 10:27am',
      subject: 'OTHER',
      type: '	Custom Confirmation',
      status: `<div class="table-action-wrapper">
                <a href="#" class="btn-action"><i class="pi pi-pencil"></i></a>
                <a href="#" class="btn-action"><i class="pi pi-times"></i></a>
              </div>`,
    },
  ];

  onSort() {
    // Implement your sorting logic here
  }

  onFilter() {
    // Implement your filtering logic here
  }

  onPage() {
    // Implement your pagination logic here
  }
}
