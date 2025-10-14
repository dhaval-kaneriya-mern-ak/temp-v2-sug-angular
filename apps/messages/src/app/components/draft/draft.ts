import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import {
  ISugTableConfig,
  ISugTableColumn,
  SugUiDialogComponent,
  DialogConfig,
  SugUiLoadingSpinnerComponent,
} from '@lumaverse/sug-ui';
import { BadgeModule } from 'primeng/badge';
import { SugUiTableComponent, SugUiButtonComponent } from '@lumaverse/sug-ui';
import { DraftService } from './draft.service';
import { DraftMessage } from '@services/interfaces';
import { Router } from '@angular/router';

interface DraftItem {
  created: string;
  subject: string;
  type: string;
  status: undefined;
}

interface ExtendedDraftMessage extends DraftMessage {
  actions?: string;
  _itemData?: DraftMessage;
}

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
export class Draft implements OnInit {
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
  isLoading = false;
  draftService = inject(DraftService);
  private router = inject(Router);
  page = 1;
  rows = 10;
  sortField = 'created';
  sortOrder = 'desc';

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

  tableData: ExtendedDraftMessage[] = [];

  getMessageTemplates() {
    this.isLoading = true;
    this.draftService.getMessageTemplates().subscribe((response) => {
      // Handle the response from the service
      this.tableData = response.data.map(
        (item): ExtendedDraftMessage => ({
          created: item.created,
          subject: item.subject,
          messageid: item.messageid,
          messagetypeid: item.messagetypeid,
          messagetype: item.messagetype,
          _itemData: item, // Store original item data
        })
      );
      this.isLoading = false;
    });
  }

  ngOnInit(): void {
    this.getMessageTemplates();
  }

  onActionClick(event: any) {
    this.openDeleteDialog(event.data);
  }

  editDraft() {
    this.router.navigate([`/messages/compose/email`]);
  }

  deleteItem(item: DraftMessage) {
    // Convert item to DraftItem for the dialog
    const draftItem: DraftItem = {
      created: item.created,
      subject: item.subject,
      type: item.messagetype,
      status: undefined,
    };
    this.openDeleteDialog(draftItem);
  }

  onSort(event: { field: string; order: number }) {
    this.sortField = event.field;
    this.sortOrder = event.order === 1 ? 'asc' : 'desc';
    this.page = 1; // Reset to first page when sorting
    // this.getMessageTemplates();
  }
  onPage(event: { first: number; rows: number }) {
    this.tableData = [];
    this.page = event.first / event.rows + 1;
    this.rows = event.rows;
    this.getMessageTemplates();
  }
}
