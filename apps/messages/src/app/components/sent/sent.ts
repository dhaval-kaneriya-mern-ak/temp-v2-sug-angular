import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import {
  ISugTableConfig,
  ISugTableColumn,
  SugUiLoadingSpinnerComponent,
  SugUiPaginationComponent,
  IPagination,
} from '@lumaverse/sug-ui';
import { BadgeModule } from 'primeng/badge';
import { SugUiTableComponent } from '@lumaverse/sug-ui';
import { RouterOutlet, Router } from '@angular/router';
import { SentService } from './sent.service';
import { SentMessage } from '@services/interfaces/messages-interface/sent.interface';
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
    SugUiPaginationComponent,
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

  // Pagination configuration using signal
  paginationKey = 'sent-pagination';
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
    const currentPage =
      Math.floor(
        this.paginationOptions().first / this.paginationOptions().rows
      ) + 1;
    this.sentService
      .getMessageSentWithPagination(
        currentPage,
        this.paginationOptions().rows,
        this.sortField,
        this.sortOrder
      )
      .subscribe({
        next: (apiResponse) => {
          if (apiResponse.data && apiResponse.data.messages) {
            this.paginationOptions.update((p) => ({
              ...p,
              totalRecords: apiResponse.data.totalcount,
            }));
            const mappedData = apiResponse.data.messages.map(
              (item: SentMessage) => ({
                messageid: item.messageid,
                senddate: this.userStateService.convertESTtoUserTZ(
                  Number(item?.sentdate || 0),
                  this.userData?.zonename || 'EST',
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
    // Reset to first page when sorting
    this.paginationOptions.update((p) => ({
      ...p,
      first: 0,
    }));
    this.getMessageSummary();
  }

  onPaginationChange(event: IPagination) {
    this.paginationOptions.set(event);
    this.getMessageSummary();
  }

  onActionClick(event: { messageid: number }) {
    this.router.navigate([`/messages/sent/${event.messageid}`]);
  }
}
