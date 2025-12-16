import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import {
  ISugTableColumn,
  SugUiDialogComponent,
  DialogConfig,
  SugUiLoadingSpinnerComponent,
  ISugTableConfig,
  SugUiPaginationComponent,
  IPagination,
} from '@lumaverse/sug-ui';
import { BadgeModule } from 'primeng/badge';
import { SugUiTableComponent, SugUiButtonComponent } from '@lumaverse/sug-ui';
import { ScheduleService } from './schedule.servvice';
import { MemberProfile, Message, MessageTypeId } from '@services/interfaces';
import { Router } from '@angular/router';
import { UserStateService } from '@services/user-state.service';
import { filter, take } from 'rxjs';

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
    SugUiPaginationComponent,
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
  };
  isVisible = false;
  selectedItem: Message | null = null;

  // Pagination configuration using signal
  paginationKey = 'schedule-pagination';
  paginationOptions = signal<IPagination>({
    totalRecords: 0,
    rows: 10,
    first: 0,
    pageSizes: [10, 25, 50, 100],
  });

  sortField = 'senddate';
  sortOrder: 'asc' | 'desc' = 'desc';
  tableConfig: ISugTableConfig = {
    sortField: 'senddate',
    sortOrder: -1, // -1 for desc, 1 for asc
  };
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
      sortable: false,
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
  readonly messageTypeIds = MessageTypeId;

  userData: MemberProfile | null = null;
  private userStateService = inject(UserStateService);

  constructor() {
    this.userStateService.userProfile$
      .pipe(
        filter((profile) => !!profile),
        take(1)
      )
      .subscribe((profile) => {
        this.userData = profile;
        this.getList();
      });
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
    this.tableConfig = {
      ...this.tableConfig,
      sortField: this.sortField,
      sortOrder: event.order,
    };
    // Reset to first page when sorting
    this.paginationOptions.update((p) => ({
      ...p,
      first: 0,
    }));
    this.getList();
  }

  onPaginationChange(event: IPagination) {
    this.paginationOptions.set(event);
    this.getList();
  }

  onActionClick(event: { data: Message } | Message | Event): void {
    // Handle different event structures from table component
    let message: Message | null = null;

    if ('data' in event && event.data) {
      message = event.data;
    } else if ('messageid' in event) {
      message = event as Message;
    }

    if (message) {
      this.openDeleteDialog(message);
    }
  }

  editMessage(rowData: Message): void {
    const messageId = rowData.messageid;

    // Email Templates (Reminder/Confirmation templates)
    if (
      rowData.messagetypeid == this.messageTypeIds.ReminderTemplate ||
      rowData.messagetypeid == this.messageTypeIds.ConfirmationTemplate
    ) {
      this.router.navigate([`/messages/compose/template`], {
        queryParams: { id: messageId },
      });
    }
    // Email Messages (Invite/General/Custom emails)
    else if (
      rowData.messagetypeid == this.messageTypeIds.EmailParticipants ||
      rowData.messagetypeid == this.messageTypeIds.InviteToSignUp
    ) {
      this.router.navigate([`/messages/compose/email`], {
        queryParams: { id: messageId },
      });
    }
    // Text Messages
    else if (
      rowData.messagetypeid == this.messageTypeIds.TextInvite ||
      rowData.messagetypeid == this.messageTypeIds.TextParticipants
    ) {
      this.router.navigate([`/messages/compose/text`], {
        queryParams: { id: messageId },
      });
    }
  }

  getList(): void {
    this.isLoading = true;
    this.tableData = [];
    const currentPage =
      Math.floor(
        this.paginationOptions().first / this.paginationOptions().rows
      ) + 1;
    this.scheduleService
      .getScheduleMessageList(
        0,
        currentPage,
        this.paginationOptions().rows,
        this.sortField,
        this.sortOrder
      )
      .subscribe({
        next: (apiResponse) => {
          if (apiResponse.data && apiResponse.data.messages) {
            this.isLoading = false;
            this.paginationOptions.update((p) => ({
              ...p,
              totalRecords: apiResponse.data.totalcount,
            }));
            const mappedData = apiResponse.data.messages.map(
              (item: Message) => {
                const formattedDate = this.userStateService.convertESTtoUserTZ(
                  Number(item.senddate),
                  this.userData?.zonename || 'EST',
                  this.userData?.selecteddateformat?.short.toUpperCase() +
                    ' hh:mma'
                );
                return {
                  ...item,
                  senddate: formattedDate,
                };
              }
            );
            this.tableData = mappedData;
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.tableData = [];
          this.paginationOptions.update((p) => ({
            ...p,
            totalRecords: 0,
          }));
          console.error('Error fetching scheduled messages:', error);
        },
      });
  }

  deleteScheduleMessage(): void {
    if (!this.selectedItem) return;
    this.scheduleService
      .deleteScheduleMessage(this.selectedItem.messageid)
      .subscribe({
        next: () => {
          this.closeDeleteDialog();
          this.getList(); // Refresh the list after deletion
        },
        error: (error) => {
          console.error('Error deleting message:', error);
        },
      });
  }
}
