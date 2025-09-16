import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ISugTableConfig, ISugTableColumn } from '@lumaverse/sug-ui';
import { BadgeModule } from 'primeng/badge';
import { HttpClientModule } from '@angular/common/http';
import { SugUiTableComponent, SugUiButtonComponent } from '@lumaverse/sug-ui';

@Component({
  selector: 'sug-schedule',
  imports: [
    CommonModule,
    SugUiTableComponent,
    SugUiButtonComponent,
    ButtonModule,
    BadgeModule,
    HttpClientModule,
  ],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss',
})
export class Schedule {
  tableConfig: ISugTableConfig = {};
  tableColumns: ISugTableColumn[] = [
    {
      field: 'scheduled',
      header: 'Scheduled For',
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
      scheduled: '06/20/2025 10:08am',
      subject: 'test reminder',
      type: 'Custom Reminder',
      status: `<div class="table-action-wrapper">
                <a href="#" class="btn-action"><i class="pi pi-pencil"></i></a>
                <a href="#" class="btn-action"><i class="pi pi-times"></i></a>
              </div>`,
    },
    {
      scheduled: '07/30/2025 10:26am',
      subject: 'test psql signup Invite',
      type: 'Custom Confirmation',
      status: `<div class="table-action-wrapper">
                <a href="#" class="btn-action"><i class="pi pi-pencil"></i></a>
                <a href="#" class="btn-action"><i class="pi pi-times"></i></a>
              </div>`,
    },
    {
      scheduled: '08/19/2025 3:15am',
      subject: 'test Invite',
      type: 'Invite',
      status: `<div class="table-action-wrapper">
                <a href="#" class="btn-action"><i class="pi pi-pencil"></i></a>
                <a href="#" class="btn-action"><i class="pi pi-times"></i></a>
              </div>`,
    },
    {
      scheduled: '08/19/2025 3:15am',
      subject: 'test Invite',
      type: 'Invite',
      status: `<div class="table-action-wrapper">
                <a href="#" class="btn-action"><i class="pi pi-pencil"></i></a>
                <a href="#" class="btn-action"><i class="pi pi-times"></i></a>
              </div>`,
    },
    {
      scheduled: '07/30/2025 10:27am',
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
