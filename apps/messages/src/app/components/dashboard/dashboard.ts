import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SugUiProgressBarComponent,
  SugUiTableComponent,
  SugUiButtonComponent,
  SugUiLoadingSpinnerComponent,
} from '@lumaverse/sug-ui';
import { ISugTableConfig, ISugTableColumn } from '@lumaverse/sug-ui';
import { SugApiService } from '@services/sug-api.service';
import { UserStateService } from '@services/user-state.service';
import { DashboardService } from './dashboard.service';
import { environment } from '@environments/environment';
import { MemberProfile, MessageItem } from '@services/interfaces';
import { Router } from '@angular/router';
import { format } from 'date-fns';
import { Subject, takeUntil } from 'rxjs';
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
export class Dashboard implements OnInit, OnDestroy {
  protected readonly dashboardService = inject(DashboardService);
  protected readonly sugApiService = inject(SugApiService);
  protected readonly userStateService = inject(UserStateService);
  protected readonly router = inject(Router);

  // Subscription management
  private readonly destroy$ = new Subject<void>();

  // User plan display
  planName = 'Loading...';
  userData: MemberProfile | null = null;

  // Progress tracking properties
  progressToday = '0 of 10,000 email messages sent today';
  progressTodayValue = 0;
  progressTodayMaxValue = 0;
  progressMonth = '0 of 20 email messages sent this month';
  progressMonthValue = 0;
  progressMonthMaxValue = 0;
  progressTextMessage = '0 of 14 text messages sent this month';
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

  ngOnInit(): void {
    this.sugApiService.createSugApiClient(environment.apiBaseUrl);
    this.loadUserProfileData();
    this.getMessageLimit();
    this.getMessageSummary();
  }

  private loadUserProfileData(): void {
    // NO API call here - just subscribe to shared state from service
    // The header component already triggers the API call
    this.userStateService.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.userData = profile;
          this.planName = profile
            ? this.userStateService.getPlanDisplayName(profile)
            : 'Loading...';
        },
        error: () => {
          this.planName = 'Free';
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        this.progressToday = `${this.progressTodayValue} of ${this.progressTodayMaxValue} email messages sent today`;
        this.progressMonth = `${this.progressMonthValue} of ${this.progressMonthMaxValue} email messages sent this month`;
        this.progressTextMessage = `${this.progressTextMessageValue} of ${this.progressTextMessageMaxValue} text messages sent this month`;
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
            sentdate: this.userStateService.convertESTtoUserTZ(
              Number(item?.sentdate || 0),
              this.userData?.zonename || 'UTC',
              this.userData?.selecteddateformat?.short.toUpperCase() + ' hh:mma'
            ),
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
