import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import {
  ISugTableColumn,
  SugUiDialogComponent,
  DialogConfig,
  SugUiLoadingSpinnerComponent,
  ISugTableConfig,
} from '@lumaverse/sug-ui';
import { BadgeModule } from 'primeng/badge';
import { SugUiTableComponent, SugUiButtonComponent } from '@lumaverse/sug-ui';
import { DraftService } from './draft.service';
import {
  DraftMessage,
  MemberProfile,
  MessageTypeId,
  selectedDraft,
} from '@services/interfaces';
import { Router } from '@angular/router';
import { format } from 'date-fns';
import { UserStateService } from '@services/user-state.service';
import { of, Subject } from 'rxjs';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  filter,
  take,
  catchError,
  finalize,
} from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'sug-draft',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SugUiTableComponent,
    SugUiButtonComponent,
    SugUiDialogComponent,
    ButtonModule,
    BadgeModule,
    SugUiLoadingSpinnerComponent,
  ],
  templateUrl: './draft.html',
  styleUrl: './draft.scss',
})
export class Draft implements OnDestroy, OnInit {
  private toastr = inject(ToastrService);
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
    width: '30vw',
  };
  isVisible = false;
  selectedItem: selectedDraft | null = null;
  isLoading = false;
  draftService = inject(DraftService);
  private router = inject(Router);
  page = 1;
  rows = 25;
  sortField = 'datecreated';
  sortOrder: 'asc' | 'desc' = 'desc';
  tableConfig: ISugTableConfig = {
    sortField: 'datecreated',
    sortOrder: -1,
  };
  tableColumns: ISugTableColumn[] = [
    {
      field: 'datecreated',
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
      field: 'messagetype',
      header: 'Type',
      sortable: false,
      filterable: false,
    },
    {
      field: 'action',
      header: ' ',
      sortable: false,
      filterable: false,
    },
  ];
  totalRecords = 0;
  first = 0; // Important for proper pagination tracking
  tableData: DraftMessage[] = [];
  searchTerm = '';
  searchControl = new FormControl('');
  private destroy$ = new Subject<void>();
  private readonly SEARCH_DEBOUNCE_MS = 300;
  readonly messageTypeIds = MessageTypeId;

  private userStateService = inject(UserStateService);
  userData: MemberProfile | null = null;

  ngOnInit(): void {
    this.userStateService.userProfile$
      .pipe(
        filter((profile) => !!profile),
        take(1)
      )
      .subscribe((profile) => {
        this.userData = profile;
        this.getDraftMessages();
      });

    this.searchControl.valueChanges
      .pipe(
        debounceTime(this.SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((val: string | null) => {
        this.searchTerm = val || '';
        this.page = 1;
        this.first = 0;
        this.getDraftMessages();
      });
  }

  openDeleteDialog(item: selectedDraft) {
    this.selectedItem = item;
    this.isVisible = true;
  }

  closeDeleteDialog() {
    const messageId = this.selectedItem?.messageid;
    this.isLoading = true;

    if (messageId) {
      this.draftService.deleteDraftMessage(messageId).subscribe({
        next: (response) => {
          if (response.success === true) {
            this.isLoading = false;
            this.selectedItem = null;
            this.isVisible = false;
            // this.toastr.success('Message deleted successfully');
            this.getDraftMessages();
          } else {
            // this.toastr.error(
            //   'Failed to delete the message. Please try again.'
            // );
            this.isLoading = false;
            this.selectedItem = null;
            this.isVisible = false;
          }
        },

        error: (error) => {
          console.error('Delete API Error:', error);

          this.isLoading = false;
          this.isVisible = false;
          this.selectedItem = null;

          // this.toastr.error('Failed to delete the message. Please try again.');
        },
      });
    } else {
      // this.toastr.error('Message not selected yet.');
    }
  }

  getDraftMessages() {
    this.isLoading = true;
    this.totalRecords = 0;
    this.tableData = [];
    this.draftService
      .getMessageTemplates(
        this.page,
        this.rows,
        this.sortField,
        this.sortOrder,
        this.searchTerm
      )
      .pipe(
        catchError((err) => {
          console.error('Failed to load draft messages', err);
          return of({ data: { messages: [], totalcount: 0 } });
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((response) => {
        if (!response || !response.data) {
          console.error('Invalid API response structure:', response);
          this.tableData = [];
          this.totalRecords = 0;
          this.isLoading = false;
          return;
        }
        const messages = response.data.messages || [];
        this.totalRecords = response.data.totalcount || 0;

        this.tableData = messages.map((item) => ({
          datecreated: this.userStateService.convertESTtoUserTZ(
            Number(item.datecreated),
            this.userData?.zonename || 'UTC',
            this.userData?.selecteddateformat?.short.toUpperCase() + ' hh:mma'
          ),
          subject: item.subject,
          messageid: item.messageid,
          memberid: item.memberid,
          messagetype: item.messagetype?.toUpperCase() || '',
          messagetypeid: item.messagetypeid,
          status: item.status || '',
          body: item.body || '',
          action: 'actions',
        }));
      });
  }

  onActionClick(event: { data: DraftMessage }) {
    this.openDeleteDialog(event.data);
  }

  onSort(event: { field: string; order: number }) {
    this.sortField = event.field;
    this.sortOrder = event.order === 1 ? 'asc' : 'desc';

    // Update table config to reflect current sort state
    this.tableConfig = {
      ...this.tableConfig,
      sortField: this.sortField,
      sortOrder: event.order,
    };

    this.page = 1; // Reset to first page when sorting
    this.first = 0; // Reset first index
    this.getDraftMessages();
  }

  editDraft(item: DraftMessage) {
    const messageId = item.messageid;

    // 1 - bulk
    // 2 - Custom Confirmation
    // 8 - Custom Reminder
    // 4 - Invite
    // 14 - Text Opt-in
    // 15 - Text

    if (
      item.messagetypeid == this.messageTypeIds.ConfirmationTemplate ||
      item.messagetypeid == this.messageTypeIds.ReminderTemplate
    ) {
      this.router.navigate([`/messages/compose/template`], {
        queryParams: { id: messageId },
      });
    } else if (
      item.messagetypeid == this.messageTypeIds.InviteToSignUp ||
      item.messagetypeid == this.messageTypeIds.EmailParticipants
    ) {
      this.router.navigate([`/messages/compose/email`], {
        queryParams: { id: messageId },
      });
    } else if (
      item.messagetypeid == this.messageTypeIds.TextInvite ||
      item.messagetypeid == this.messageTypeIds.TextParticipants
    ) {
      this.router.navigate([`/messages/compose/text`], {
        queryParams: { id: messageId },
      });
    }
  }

  deleteItem(item: DraftMessage) {
    // Convert item to DraftMessage for the dialog
    const draftItem: selectedDraft = {
      datecreated: item.datecreated,
      messageid: item.messageid,
      subject: item.subject,
      messagetype: item.messagetype,
      messagetypeid: item.messagetypeid,
    };
    this.openDeleteDialog(draftItem);
  }

  onPage(event: { first: number; rows: number }) {
    this.first = event.first;
    this.page = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.getDraftMessages();
  }

  navigateToDraft() {
    this.router.navigate([`/messages/compose/email`]);
  }

  navigateToTemplate() {
    this.router.navigate([`/messages/compose/template`]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
