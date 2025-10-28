import { Component, inject, OnInit } from '@angular/core';
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
import { DraftService } from './draft.service';
import { DraftMessage } from '@services/interfaces';
import { Router } from '@angular/router';

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
  selectedItem: DraftMessage | null = null;
  isLoading = false;
  draftService = inject(DraftService);
  private router = inject(Router);
  page = 1;
  rows = 10;
  sortField = 'created';
  sortOrder = 'desc';
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

  tableData: DraftMessage[] = [];

  ngOnInit(): void {
    this.getMessageTemplates();
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
    this.draftService.getMessageTemplates().subscribe((response) => {
      // Handle the response from the service
      if (response && response.data) {
        this.tableData = response.data.map((item) => ({
          created: item.created,
          subject: item.subject,
          messageid: item.messageid,
          messagetypeid: item.messagetypeid,
          messagetype: item.messagetype,
        }));
      }
      this.isLoading = false;
    });
  }

  onActionClick(event: any) {
    this.openDeleteDialog(event.data);
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
    this.tableData = [];
    this.page = event.first / event.rows + 1;
    this.rows = event.rows;
    this.getMessageTemplates();
  }
}
