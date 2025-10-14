import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import {
  ISugTableConfig,
  ISugTableColumn,
  SugUiDialogComponent,
  SugUiLoadingSpinnerComponent,
  DialogConfig,
} from '@lumaverse/sug-ui';
import { BadgeModule } from 'primeng/badge';
import { SugUiTableComponent, SugUiButtonComponent } from '@lumaverse/sug-ui';
import { ScheduleService } from './schedule.servvice';
import { Message } from '@services/interfaces';
import { Router } from '@angular/router';

@Component({
  selector: 'sug-schedule',
  imports: [
    CommonModule,
    SugUiTableComponent,
    SugUiButtonComponent,
    ButtonModule,
    SugUiDialogComponent,
    BadgeModule,
    SugUiLoadingSpinnerComponent,
  ],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss',
})
export class Schedule {
  scheduleService = inject(ScheduleService);
  private router = inject(Router);
  isLoading = false;
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
  selectedItem: Message | null = null;
  totalRecords = 0;
  page = 1;
  rows = 10;
  sortField = 'datecreated';
  sortOrder = 'desc';

  constructor() {
    this.getList();
  }
  openDeleteDialog(item: Message) {
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
      field: 'senddate',
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
      field: 'messagetype',
      header: 'Type',
      sortable: true,
      filterable: false,
    },
    {
      field: 'action',
      header: 'Actions',
      sortable: false,
      filterable: false,
    },
  ];

  tableData: Message[] = [];

  onSort(event: { field: string; order: number }) {
    this.sortField = event.field;
    this.sortOrder = event.order === 1 ? 'asc' : 'desc';
    this.page = 1; // Reset to first page when sorting
    // this.getList();
  }

  onFilter(event: unknown) {
    console.log(event, 'FILTER EVENT');
    // Implement your filtering logic here
  }

  onPage(event: { first: number; rows: number }) {
    this.tableData = [];
    this.page = event.first / event.rows + 1;
    this.rows = event.rows;
    this.getList();
  }

  onActionClick(event: any) {
    this.openDeleteDialog(event.data);
  }

  editMessage(rowData: any) {
    this.router.navigate([`/messages/compose/email`]);
  }

  getList() {
    this.isLoading = true;
    this.tableData = [];
    this.totalRecords = 0;
    this.scheduleService
      .getScheduleMessageList(
        0,
        this.page,
        this.rows,
        this.sortField,
        this.sortOrder
      )
      .subscribe({
        next: (apiResponse) => {
          if (apiResponse.data) {
            this.totalRecords = apiResponse.data.totalcount;
            this.tableData = apiResponse.data.messages.map((item: Message) => ({
              ...item,
            }));
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error fetching scheduled messages:', error);
        },
      });
  }

  deleteScheduleMessage() {
    if (!this.selectedItem) return;
    this.scheduleService
      .deleteScheduleMessage(this.selectedItem.messageid)
      .subscribe({
        next: (response) => {
          this.closeDeleteDialog();
          this.getList(); // Refresh the list after deletion
        },
        error: (error) => {
          console.error('Error deleting message:', error);
        },
      });
  }
}
