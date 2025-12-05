import { Component, inject, signal } from '@angular/core';
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
import { UserStateService } from '@services/user-state.service';
import { MemberProfile } from '@services/interfaces';
import { filter, take } from 'rxjs';

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
  private userStateService = inject(UserStateService);
  userProfile = signal<MemberProfile | null>(null);
  isLoading = false;
  totalRecords = 0;
  page = 1;
  rows = 10;
  first = 0; // Important for proper pagination tracking
  sortField = 'senddate';
  sortOrder: 'asc' | 'desc' = 'desc';
  tableConfig: ISugTableConfig = {
    sortField: 'senddate',
    sortOrder: -1, // -1 for desc, 1 for asc
  };
  tableColumns: ISugTableColumn[] = [
    {
      field: 'senddate',
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
      field: 'totalsent',
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
  userData: MemberProfile | null = null;

  constructor() {
    this.userStateService.userProfile$
      .pipe(
        filter((profile) => !!profile),
        take(1)
      )
      .subscribe((profile) => {
        this.userData = profile;
        this.getMessageSummary();
      });
  }

  getMessageSummary() {
    this.isLoading = true;
    this.tableData = [];
    this.totalRecords = 0;
    this.sentService
      .getMessageSentWithPagination(
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
              (item: SentMessage) => ({
                messageid: item.messageid,
                senddate: this.userStateService.convertESTtoUserTZ(
                  Number(item?.sentdate || 0),
                  this.userData?.zonename || 'UTC',
                  this.userData?.selecteddateformat?.short.toUpperCase() +
                    ' hh:mma'
                ),
                subject: `<div class="subject-text">
                        <span class="subject-text">${
                          item.subject || 'No Subject'
                        }</span>
                        <span class="sub-text">${item.messagetype} - ${
                  item.status
                }</span>
                      </div>`,
                totalsent: item.totalsent || 0,
                status: item.status,
                action: `<i class="pi pi-chart-bar chart-icon" 
              data-message-id="${item.messageid}" title="View message details"></i>`,
                originalData: item,
              })
            );
            this.tableData = mappedData;
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error fetching message summary:', error);
          // Reset data on error
          this.tableData = [];
        },
      });
  }

  onSort(event: { field: string; order: number }) {
    this.sortField = event.field;
    this.sortOrder = event.order === 1 ? 'asc' : 'desc';
    this.tableConfig = {
      ...this.tableConfig,
      sortField: this.sortField,
      sortOrder: event.order,
    };
    this.page = 1; // Reset to first page when sorting
    this.first = 0; // Reset first index
    this.getMessageSummary();
  }

  onPage(event: { first: number; rows: number }) {
    // Update pagination state BEFORE making API call
    this.first = event.first;
    this.page = Math.floor(event.first / event.rows) + 1; // Convert 0-based to 1-based
    this.rows = event.rows;
    // Fetch new data for the selected page
    this.getMessageSummary();
  }

  onActionClick(event: { messageid: number }) {
    this.router.navigate([`/messages/sent/${event.messageid}`]);
  }
}
