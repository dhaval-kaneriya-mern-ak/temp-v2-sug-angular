import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import {
  ISugTableColumn,
  SugUiDialogComponent,
  DialogConfig,
  SugUiLoadingSpinnerComponent,
} from '@lumaverse/sug-ui';
import { BadgeModule } from 'primeng/badge';
import { SugUiTableComponent, SugUiButtonComponent } from '@lumaverse/sug-ui';
import { ScheduleService } from './schedule.servvice';
import { Message } from '@services/interfaces';
import { Router } from '@angular/router';
import { format } from 'date-fns';

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
  first = 0; // Important for proper pagination tracking
  sortField = 'datecreated';
  sortOrder = 'desc';
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

  onSort(event: { field: string; order: number }) {
    this.sortField = event.field;
    this.sortOrder = event.order === 1 ? 'asc' : 'desc';
    this.page = 1; // Reset to first page when sorting
    this.first = 0; // Reset first index
    this.getList();
  }

  onPage(event: { first: number; rows: number }) {
    // Update pagination state BEFORE making API call
    this.first = event.first;
    this.page = event.rows > 0 ? Math.floor(event.first / event.rows) + 1 : 1; // Convert 0-based to 1-based, handle division by zero
    this.rows = event.rows;
    // Fetch new data for the selected page
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
          if (apiResponse.data && apiResponse.data.messages) {
            this.totalRecords = apiResponse.data.totalcount;
            const mappedData = apiResponse.data.messages.map(
              (item: Message) => ({
                ...item,
                datecreated: format(
                  new Date(Number(item.datecreated) * 1000),
                  'yyyy-MM-dd h:mmaaa'
                ),
                senddate: format(
                  new Date(Number(item.senddate) * 1000),
                  'yyyy-MM-dd h:mmaaa'
                ),
              })
            );
            this.tableData = mappedData;
            this.isLoading = false;
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.tableData = [];
          this.totalRecords = 0;
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
