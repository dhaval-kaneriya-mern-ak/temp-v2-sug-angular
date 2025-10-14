import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import {
  ISugTableConfig,
  ISugTableColumn,
  SugUiLoadingSpinnerComponent,
} from '@lumaverse/sug-ui';
import { BadgeModule } from 'primeng/badge';
import { SugUiTableComponent } from '@lumaverse/sug-ui';
import { RouterOutlet, Router } from '@angular/router';
import { SentService } from './sent.service';
import { SentMessage } from '@services/interfaces/messages-interface/sent.interface';
import { format } from 'date-fns';

@Component({
  selector: 'sug-sent',
  imports: [
    CommonModule,
    SugUiTableComponent,
    RouterOutlet,
    ButtonModule,
    BadgeModule,
    SugUiLoadingSpinnerComponent,
  ],
  templateUrl: './sent.html',
  styleUrl: './sent.scss',
})
export class Sent {
  private router = inject(Router);
  private sentService = inject(SentService);
  isLoading = false;
  totalRecords = 0;
  page = 1;
  rows = 10;
  sortField = 'senddate';
  sortOrder = 'desc';
  tableConfig: ISugTableConfig = {};
  tableColumns: ISugTableColumn[] = [
    {
      field: 'sent',
      header: 'Sent',
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
      field: 'sentTo',
      header: 'Sent To',
      sortable: true,
      filterable: false,
    },
    {
      field: 'status',
      header: 'Status',
      sortable: true,
      filterable: false,
    },
    {
      field: 'action',
      header: '',
      sortable: false,
      filterable: false,
    },
  ];

  tableData: SentMessage[] = [];

  constructor() {
    this.getMessageSummary();
  }

  getMessageSummary() {
    this.isLoading = true;
    this.tableData = [];
    this.totalRecords = 0;
    this.sentService
      .getMessageSentWithPagination(
        0,
        this.page,
        this.rows,
        this.sortField,
        this.sortOrder
      )
      .subscribe({
        next: (apiResponse) => {
          // if (apiResponse.success && apiResponse.data.messages) {
          this.totalRecords = apiResponse.data.totalcount;
          this.tableData = apiResponse.data.messages.map(
            (item: SentMessage) => ({
              messageid: item.messageid,
              sent: format(new Date(item.sentdate || 0), 'MM/dd/yyyy h:mmaaa'),
              subject: `<div class="subject-text">
                        <span class="subject-text">${
                          item.subject || 'No Subject'
                        }</span>
                        <span class="sub-text">${item.messagetype} - ${
                item.status
              }</span>
                      </div>`,
              sentTo: `${item.totalsent || 0}`,
              status: item.status,
              action: `<i class="pi pi-chart-bar chart-sent-icon" 
              data-message-id="${item.messageid}" title="View message details"></i>`,
              // Keep original data for reference
              originalData: item,
            })
          );
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error fetching message summary:', error);
        },
      });
  }

  onSort(event: { field: string; order: number }) {
    console.log('Sort event:', event);
    this.sortField = event.field;
    this.sortOrder = event.order === 1 ? 'asc' : 'desc';
    this.page = 1; // Reset to first page when sorting
    // this.getMessageSummary();
  }

  onPage(event: { first: number; rows: number }) {
    console.log('Page event:', event);
    // this.tableData = [];
    this.page = event.first / event.rows + 1;
    this.rows = event.rows;
    this.getMessageSummary();
  }

  onActionClick(event: any) {
    this.navigateToSentDetails(event.messageid);
  }

  navigateToSentDetails(messageId: number) {
    this.router.navigate([`/messages/sent/${messageId}`]);
  }
}
