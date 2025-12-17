import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SugUiProgressBarComponent,
  SugUiTableComponent,
  SugUiButtonComponent,
  SugUiLoadingSpinnerComponent,
  SugUiDeliveryStatsComponent,
  DeliveryStatsItem,
} from '@lumaverse/sug-ui';
import { ISugTableConfig, ISugTableColumn } from '@lumaverse/sug-ui';
import { SugApiService } from '@services/sug-api.service';
import { UserStateService } from '@services/user-state.service';
import { DashboardService } from './dashboard.service';
import { environment } from '@environments/environment';
import {
  CHART_COLORS,
  CHART_LABELS,
  IMessageDeliveryStats,
  LABEL_RADIUS_MULTIPLIER,
  MemberProfile,
  MessageItem,
} from '@services/interfaces';
import { Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { ChartConfiguration, Plugin } from 'chart.js';
import { Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'sug-dashboard',
  imports: [
    CommonModule,
    SugUiProgressBarComponent,
    SugUiTableComponent,
    SugUiButtonComponent,
    SugUiLoadingSpinnerComponent,
    ChartModule,
    SugUiDeliveryStatsComponent,
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
  // Chart properties
  deliveryStats: DeliveryStatsItem[] = [];
  chartData: ChartConfiguration<'pie'>['data'] | null = null;
  chartOptions: ChartConfiguration<'pie'>['options'] | null = null;
  chartPlugins: Plugin<'pie'>[] = [];

  get hasDeliveryStats(): boolean {
    return this.deliveryStats.some(
      (stat) => stat.label !== 'Total Sent' && stat.value > 0
    );
  }

  ngOnInit(): void {
    this.sugApiService.createSugApiClient(environment.apiBaseUrl);
    this.loadUserProfileData();
    this.getMessageLimit();
    this.getMessageSummary();
    this.initializeChart();
    this.initializeChartPlugins();
    this.getMessageDeliveryStats();
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
    this.dashboardService
      .getMessageLimits()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
    this.dashboardService
      .getMessageSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            const flatData = Array.isArray(response.data[0])
              ? response.data.flat()
              : response.data;
            this.tableData = flatData.map((item: MessageItem) => ({
              messageid: item.messageid,
              sentdate: this.userStateService.convertESTtoUserTZ(
                Number(item?.sentdate || 0),
                this.userData?.zonename || 'EST',
                this.userData?.selecteddateformat?.short.toUpperCase() +
                  ' hh:mma'
              ),
              subject: item.subject,
              sentTo: item.sentTo || `${item.totalsent || 0}`,
              action: `<i class="fa-solid fa-chart-pie chart-icon" 
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

  getMessageDeliveryStats() {
    this.isLoading = true;
    this.dashboardService
      .getMessageDeliveryStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.deliveryStats = response.data.map(
            (item: IMessageDeliveryStats) => ({
              label: item.name,
              value: item.ct,
              badgeColor: item.badgestyle,
            })
          );
          const chartData = {
            delivered:
              this.deliveryStats.find((s) =>
                s.label.toLowerCase().includes('delivered')
              )?.value || 0,
            bounced:
              this.deliveryStats.find((s) =>
                s.label.toLowerCase().includes('bounced')
              )?.value || 0,
            dropped:
              this.deliveryStats.find((s) =>
                s.label.toLowerCase().includes('dropped')
              )?.value || 0,
            spam:
              this.deliveryStats.find((s) =>
                s.label.toLowerCase().includes('spam')
              )?.value || 0,
          };
          this.setupChartData(chartData);
        },
        error: (error) => {
          this.isLoading = false;
          this.deliveryStats = [];
          console.error('Error fetching delivery stats:', error);
        },
      });
  }

  private setupChartData(deliveryStats: {
    delivered: number;
    bounced: number;
    dropped: number;
    spam: number;
  }): void {
    // Create pie chart data (exclude Total Sent, only show breakdown)
    const colors = [
      CHART_COLORS.DELIVERED,
      CHART_COLORS.BOUNCED,
      CHART_COLORS.DROPPED,
      CHART_COLORS.SPAM,
    ];

    this.chartData = {
      labels: [...CHART_LABELS],
      datasets: [
        {
          data: [
            deliveryStats.delivered,
            deliveryStats.bounced,
            deliveryStats.dropped,
            deliveryStats.spam,
          ],
          backgroundColor: colors,
          hoverBackgroundColor: colors,
        },
      ],
    };
  }

  private initializeChart(): void {
    this.chartOptions = {
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce(
                (acc: number, curr: number) => acc + curr,
                0
              );
              const percentage = ((value / total) * 100).toFixed(2);
              return ` ${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
      elements: {
        arc: {
          borderWidth: 2,
          borderColor: '#fff',
        },
      },
    };
  }

  private initializeChartPlugins(): void {
    // Custom plugin to draw percentage labels on pie slices
    const percentagePlugin: Plugin<'pie'> = {
      id: 'percentageLabels',
      afterDatasetDraw: (chart) => {
        const ctx = chart.ctx;
        const dataset = chart.data.datasets[0];
        const meta = chart.getDatasetMeta(0);
        const total = dataset.data.reduce(
          (acc: number, val: number) => acc + val,
          0
        );

        meta.data.forEach((arc, index) => {
          const value = dataset.data[index];
          const percentage = ((value / total) * 100).toFixed(0);

          // Only draw label if value is greater than 0
          if (value > 0) {
            // Type assertion for arc element properties
            const arcElement = arc as unknown as {
              x: number;
              y: number;
              startAngle: number;
              endAngle: number;
              outerRadius: number;
            };

            // Calculate position for label
            const midAngle = (arcElement.startAngle + arcElement.endAngle) / 2;
            const x =
              arcElement.x +
              Math.cos(midAngle) *
                (arcElement.outerRadius * LABEL_RADIUS_MULTIPLIER);
            const y =
              arcElement.y +
              Math.sin(midAngle) *
                (arcElement.outerRadius * LABEL_RADIUS_MULTIPLIER);

            // Draw percentage text
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${percentage}%`, x, y);
            ctx.restore();
          }
        });
      },
    };

    this.chartPlugins = [percentagePlugin];
  }

  onActionClick(event: { messageid: number }) {
    this.navigateToSentDetails(event.messageid);
  }

  navigateToSentDetails(messageId: number) {
    this.router.navigate([`/messages/sent/${messageId}`]);
  }
}
