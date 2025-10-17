import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SugUiProgressBarComponent,
  SugUiTableComponent,
  SugUiButtonComponent,
  SugUiLoadingSpinnerComponent,
} from '@lumaverse/sug-ui';
import { ISugTableConfig, ISugTableColumn } from '@lumaverse/sug-ui';
import { SugApiService } from '@services/sug-api.service';
import { DashboardService } from './dashboard.service';
import { environment } from '@environments/environment';
import { MessageItem } from '@services/interfaces';
import { Router } from '@angular/router';
import { format } from 'date-fns';
@Component({
  selector: 'sug-dashboard',
  imports: [
    CommonModule,
    SugUiProgressBarComponent,
    SugUiTableComponent,
    SugUiButtonComponent,
    SugUiLoadingSpinnerComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  protected dashboardService = inject(DashboardService);
  protected sugApiService = inject(SugApiService);
  protected router = inject(Router);
  // emailMessagesUsedToday = 'Loading files..';
  progressToday = '0 / 10,000 email messages used today';
  progressTodayValue = 0;
  progressTodayMaxValue = 0;
  progressMonth = '0 / 20 email messages used this month';
  progressMonthValue = 0;
  progressMonthMaxValue = 0;
  progressTextMessage = '0 / 14 text messages used this month';
  progressTextMessageValue = 0;
  progressTextMessageMaxValue = 0;

  tableData: MessageItem[] = [];
  selectedItems: MessageItem[] = [];
  tableConfig: ISugTableConfig = {};
  isLoading = false;
  tableColumns: ISugTableColumn[] = [
    {
      field: 'sentdate',
      header: 'Date Sent',
      sortable: true,
      filterable: false,
      width: '120px',
    },
    {
      field: 'subject',
      header: 'Subject',
      sortable: true,
      filterable: false,
      width: '150px',
    },
    {
      field: 'sentTo',
      header: 'Sent To',
      sortable: true,
      filterable: false,
      width: '200px',
    },
    {
      field: 'action',
      header: '',
      sortable: false,
      filterable: false,
      width: '40px',
    },
  ];

  constructor() {
    // console.log('Table Data Length:', this.tableData.length);
  }

  ngOnInit(): void {
    this.sugApiService.createSugApiClient(environment.apiBaseUrl);
    this.getMessageLimit();
    this.getMessageSummary();
  }

  onSelectionChange(): void {
    console.log('Selected items:', this.selectedItems);
  }

  onViewMore(): void {
    this.router.navigate(['messages/sent']);
  }

  getCurrentMonthName(): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[new Date().getMonth()];
  }

  getMessageLimit() {
    this.dashboardService.getMessageLimits().subscribe({
      next: (response) => {
        this.progressTodayValue = response.data.sentemailtoday;
        this.progressTodayMaxValue = response.data.dailylimit;
        this.progressMonthValue = response.data.sentemailforthemonth;
        this.progressMonthMaxValue = response.data.monthlylimit;
        this.progressTextMessageValue = response.data.senttexttoday;
        this.progressTextMessageMaxValue = response.data.textmessagelimit;
        this.progressToday = `${this.progressTodayValue} / ${this.progressTodayMaxValue} email messages used today`;
        this.progressMonth = `${this.progressMonthValue} / ${this.progressMonthMaxValue} email messages used this month`;
        this.progressTextMessage = `${this.progressTextMessageValue} / ${this.progressTextMessageMaxValue} text messages used this month`;
      },
      error: () => {
        // this.handleLogout();
        // this.isLoading.set(false);
      },
    });
  }
  getMessageSummary() {
    this.isLoading = true;
    this.dashboardService.getMessageSummary().subscribe({
      next: (response) => {
        if (response.data) {
          const flatData = Array.isArray(response.data[0])
            ? response.data.flat()
            : response.data;
          this.tableData = flatData.map((item: MessageItem) => ({
            messageid: item.messageid,
            sentdate: item.sentdate
              ? format(
                  new Date(Number(item.sentdate) * 1000),
                  'yyyy-MM-dd h:mmaaa'
                )
              : '',
            subject: item.subject,
            sentTo: item.sentTo || `${item.totalsent || 0}`,
            action: `<i class="pi pi-chart-bar chart-icon" 
          style="cursor: pointer;" 
          data-message-id="${item.messageid}"
          title="View message details"></i>`,
            messagetype: item.messagetype,
            status: item.status,
            timezone: item.timezone,
            createdby: item.createdby,
            totalsent: item.totalsent,
          }));
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.tableData = [];
        console.error('Error fetching message summary:', error);
      },
    });
  }

  onActionClick(event: { messageid: number }) {
    this.navigateToSentDetails(event.messageid);
  }

  navigateToSentDetails(messageId: number) {
    this.router.navigate([`/messages/sent/${messageId}`]);
  }
}
