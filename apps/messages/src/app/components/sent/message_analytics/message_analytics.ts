import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ISugTableConfig,
  ISugTableColumn,
  SugUiDeliveryStatsComponent,
  DeliveryStatsItem,
  SugUiTableComponent,
} from '@lumaverse/sug-ui';
import { ActivatedRoute } from '@angular/router';
import { MessageAnalyticsService } from './message-analytics.service';
import { MessageStatsResponse, SentDetails } from '@services/interfaces';

@Component({
  selector: 'sug-message-analytics',
  imports: [CommonModule, SugUiDeliveryStatsComponent, SugUiTableComponent],
  templateUrl: './message_analytics.html',
  styleUrl: './message_analytics.scss',
})
export class MessageAnalyticsComponent {
  messageAnalyticsService = inject(MessageAnalyticsService);
  activatedRoute = inject(ActivatedRoute);
  deliveryStats: DeliveryStatsItem[] = [];
  responseStats: DeliveryStatsItem[] = [];
  tableConfig: ISugTableConfig = {};
  tableColumns: ISugTableColumn[] = [
    {
      field: 'email',
      header: 'Email',
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
      field: 'issues',
      header: 'Issues',
      sortable: true,
      filterable: false,
    },
    {
      field: 'signedup',
      header: 'Signed Up',
      sortable: true,
      filterable: false,
    },
    {
      field: 'opened',
      header: 'Opened',
      sortable: true,
      filterable: false,
    },
    {
      field: 'clicked',
      header: 'Clicked',
      sortable: true,
      filterable: false,
    },
  ];
  tableData: SentDetails[] = [];
  page = 1;
  rows = 10;
  sortField = 'senddate';
  sortOrder = 'desc';
  messageId = 0;
  constructor() {
    // Get ID from parent route params
    this.messageId = this.activatedRoute.parent?.snapshot.params['id'];
    if (this.messageId) {
      this.getMessageAnalytics(this.messageId); // Convert string to number
    }
  }
  onSort(event: { field: string; order: number }) {
    this.sortField = event.field;
    this.sortOrder = event.order === 1 ? 'asc' : 'desc';
    this.page = 1; // Reset to first page when sorting
    this.getMessageAnalytics(this.messageId);
  }

  onPage(event: { first: number; rows: number }) {
    // this.tableData = []; // Clear current data to show loading state
    this.page = event.first / event.rows + 1;
    this.rows = event.rows;
    this.getMessageAnalytics(this.messageId);
  }

  getMessageAnalytics(messageId: number) {
    // this.tableData = [];
    this.messageAnalyticsService
      .getMessageAnalytics(
        messageId,
        this.page,
        this.rows,
        this.sortField,
        this.sortOrder
      )
      .subscribe({
        next: (response: MessageStatsResponse) => {
          console.log('Message analytics loaded:', response);

          // Map API response to stats array
          if (response.success && response.data) {
            const deliveryStats = response.data.deliverystats;
            const responseStats = response.data.responsestats;
            const sentDetails = response.data.sentdetails;
            this.deliveryStats = [
              {
                label: 'Total Sent',
                value: deliveryStats.totalsent,
                badgeColor: 'black',
              },
              {
                label: 'Delivered',
                value: deliveryStats.delivered,
                badgeColor: 'green',
              },
              {
                label: 'Bounced',
                value: deliveryStats.bounced,
                badgeColor: 'yellow',
              },
              {
                label: 'Dropped',
                value: deliveryStats.dropped,
                badgeColor: 'orange',
              },
              { label: 'Spam', value: deliveryStats.spam, badgeColor: 'red' },
            ];
            this.responseStats = [
              {
                label: 'Delivered',
                value: responseStats.delivered,
                badgeColor: 'green',
              },
              {
                label: 'Opened',
                value: responseStats.opened,
                badgeColor: 'blue',
              },
              {
                label: 'Unique Clicks',
                value: responseStats.uniqueclicks,
                badgeColor: 'purple',
              },
              {
                label: 'Signed Up',
                value: responseStats.signedup,
                badgeColor: 'teal',
              },
            ];
            this.tableData = sentDetails.map((detail) => ({
              email: detail.email,
              status: JSON.parse(detail.memberevents).Status,
              issues: detail.issues
                ? '<span><i class="pi pi-check"></i></span>'
                : '',
              signedup: detail.signedup
                ? '<span><i class="pi pi-check"></i></span>'
                : '',
              opened: detail.opened
                ? '<span><i class="pi pi-check"></i></span>'
                : '',
              clicked: detail.clicked
                ? '<span><i class="pi pi-check"></i></span>'
                : '',
              memberevents: detail.memberevents,
              memberid: detail.memberid,
            }));
          }
        },
        error: (error) => {
          console.error('Error loading message analytics:', error);
        },
      });
  }
}
