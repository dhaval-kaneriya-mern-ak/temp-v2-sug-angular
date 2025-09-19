import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import {
  ISugTableConfig,
  ISugTableColumn,
  SugUiDialogComponent,
  DialogConfig,
} from '@lumaverse/sug-ui';
import { BadgeModule } from 'primeng/badge';
import { HttpClientModule } from '@angular/common/http';
import { SugUiTableComponent, SugUiButtonComponent } from '@lumaverse/sug-ui';
interface DraftItem {
  created: string;
  subject: string;
  type: string;
  status: undefined;
}
@Component({
  selector: 'sug-schedule',
  imports: [
    CommonModule,
    SugUiTableComponent,
    SugUiButtonComponent,
    ButtonModule,
    SugUiDialogComponent,
    BadgeModule,
    HttpClientModule,
  ],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss',
})
export class Schedule {
  dialogConf: DialogConfig = {
    modal: true,
    draggable: true,
    resizable: false,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    focusOnShow: true,
    position: 'center',
    appendTo: 'body',
    width: '40vw',
  };
  isVisible = false;
  selectedItem: DraftItem | null = null;

  openDeleteDialog(item: DraftItem) {
    this.selectedItem = item;
    this.isVisible = true;
  }

  closeDeleteDialog() {
    this.isVisible = false;
    this.selectedItem = null;
  }
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
