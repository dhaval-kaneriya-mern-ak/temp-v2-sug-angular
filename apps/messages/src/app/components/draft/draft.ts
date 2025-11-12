import { Component, inject, OnInit } from '@angular/core';
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
import { DraftMessage, MemberProfile } from '@services/interfaces';
import { Router } from '@angular/router';
import { format } from 'date-fns';
import { UserStateService } from '@services/user-state.service';
import { filter, take } from 'rxjs';

@Component({
  selector: 'sug-draft',
  imports: [
    CommonModule,
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
export class Draft {
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
  selectedItem: DraftMessage | null = null;
  isLoading = false;
  draftService = inject(DraftService);
  private router = inject(Router);
  page = 1;
  rows = 10;
  sortField = 'created';
  sortOrder: 'asc' | 'desc' = 'desc';
  tableConfig: ISugTableConfig = {
    sortField: 'created',
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
      sortable: true,
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
  private userStateService = inject(UserStateService);
  userData: MemberProfile | null = null;

  constructor() {
    this.userStateService.userProfile$
      .pipe(
        filter((profile) => !!profile),
        take(1)
      )
      .subscribe((profile) => {
        this.userData = profile;
        this.getMessageTemplates();
      });
  }

  openDeleteDialog(item: DraftMessage) {
    this.selectedItem = item;
    this.isVisible = true;
  }

  closeDeleteDialog() {
    this.isVisible = false;
    this.selectedItem = null;
  }

  getMessageTemplates() {
    this.isLoading = true;
    this.totalRecords = 0;
    this.tableData = [];
    this.draftService
      .getMessageTemplates(this.page, this.rows, this.sortField, this.sortOrder)
      .subscribe((response) => {
        // Handle the response from the service
        if (response && response?.data?.length > 0) {
          this.totalRecords = response?.data?.length;
          this.tableData = response?.data.map((item) => ({
            datecreated: new Date(
              item.datecreated || new Date()
            ).toLocaleString(),
            subject: item.subject,
            messageid: item.messageid,
            messagetypeid: item.messagetypeid,
            messagetype: item.messagetype,
          }));
        }
        this.isLoading = false;
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
    this.getMessageTemplates();
  }

  editDraft() {
    this.router.navigate([`/messages/compose/email`]);
  }

  deleteItem(item: DraftMessage) {
    // Convert item to DraftMessage for the dialog
    const draftItem: DraftMessage = {
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
    this.getMessageTemplates();
  }

  navigateToDraft() {
    this.router.navigate([`/messages/compose/email`]);
  }

  navigateToTemplate() {
    this.router.navigate([`/messages/compose/template`]);
  }
}
