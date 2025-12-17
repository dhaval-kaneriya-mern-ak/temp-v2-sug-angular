import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ISugTableConfig,
  ISugTableColumn,
  SugUiDeliveryStatsComponent,
  DeliveryStatsItem,
  SugUiTableComponent,
  SugUiLoadingSpinnerComponent,
} from '@lumaverse/sug-ui';
import { ActivatedRoute } from '@angular/router';
import { MessageAnalyticsService } from './message-analytics.service';
import {
  MessageStatsResponse,
  SentDetails,
  CHART_COLORS,
  PERCENTAGE_THRESHOLDS,
  LABEL_RADIUS_MULTIPLIER,
  CHART_LABELS,
} from '@services/interfaces';
import { ChartModule } from 'primeng/chart';
import { ChartConfiguration, Plugin } from 'chart.js';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'sug-message-analytics',
  imports: [
    CommonModule,
    SugUiDeliveryStatsComponent,
    SugUiTableComponent,
    SugUiLoadingSpinnerComponent,
    ChartModule,
  ],
  templateUrl: './message_analytics.html',
  styleUrl: './message_analytics.scss',
})
export class MessageAnalyticsComponent implements OnInit, OnDestroy {
  // Cleanup
  private readonly destroy$ = new Subject<void>();
  messageAnalyticsService = inject(MessageAnalyticsService);
  activatedRoute = inject(ActivatedRoute);
  deliveryStats: DeliveryStatsItem[] = [];
  responseStats: DeliveryStatsItem[] = [];
  tableConfig: ISugTableConfig = {};

  // Chart configuration
  chartData: ChartConfiguration<'pie'>['data'] | null = null;
  chartOptions: ChartConfiguration<'pie'>['options'] | null = null;
  chartPlugins: Plugin<'pie'>[] = [];
  spamPercent = 0;
  spamPercentClass = 'green';
  bouncePercent = 0;
  bouncePercentClass = 'green';
  tableColumns: ISugTableColumn[] = [
    {
      field: 'email',
      header: 'Email',
      sortable: true,
      filterable: false,
    },
    {
      field: 'mobile',
      header: 'Mobile',
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
      field: 'units',
      header: 'UNITS',
      sortable: true,
      filterable: false,
    },
  ];

  tableData: SentDetails[] = [];
  page = 1;
  rows = 10;
  first = 0; // Important for proper pagination tracking
  sortField = 'senddate';
  sortOrder = 'desc';
  messageId = 0;
  isLoading = false;

  ngOnInit(): void {
    // Initialize chart configuration
    this.initializeChart();
    this.initializeChartPlugins();

    // Get ID from parent route params
    this.messageId = this.activatedRoute.parent?.snapshot.params['id'];
    if (this.messageId) {
      this.getMessageAnalytics(this.messageId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private generateDynamicColumns(membereventsJson: string): void {
    try {
      const parsedEvents = JSON.parse(membereventsJson);
      const columns: ISugTableColumn[] = [
        {
          field: 'email',
          header: 'Email',
          sortable: true,
          filterable: false,
        },
      ];

      // Add Status column first
      if (parsedEvents.Status) {
        columns.push({
          field: 'status',
          header: 'Status',
          sortable: true,
          filterable: false,
          width: '100px',
        });
      }

      // Add Issues column after Status
      columns.push({
        field: 'issues',
        header: 'Issues',
        sortable: true,
        filterable: false,
        width: '100px',
      });

      // Add Signed Up column at the end
      columns.push({
        field: 'signedup',
        header: 'Signed Up',
        sortable: true,
        filterable: false,
        width: '120px',
      });

      // Add remaining columns from memberevents (except Status)
      Object.keys(parsedEvents).forEach((key) => {
        if (key !== 'Status') {
          columns.push({
            field: key.toLowerCase(),
            header: key,
            sortable: true,
            filterable: false,
          });
        }
      });

      this.tableColumns = columns;
    } catch (error) {
      console.error('Error parsing memberevents:', error);
    }
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
              return `${label}: ${value} (${percentage}%)`;
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

  onSort(event: { field: string; order: number }) {
    this.sortField = event.field;
    this.sortOrder = event.order === 1 ? 'asc' : 'desc';
    this.page = 1; // Reset to first page when sorting
    this.first = 0; // Reset first index
    this.getMessageAnalytics(this.messageId);
  }

  onPage(event: { first: number; rows: number }) {
    // Update pagination state BEFORE making API call
    this.first = event.first;
    this.page = Math.floor(event.first / event.rows) + 1; // Convert 0-based to 1-based
    this.rows = event.rows;
    // Fetch new data for the selected page
    this.getMessageAnalytics(this.messageId);
  }

  getMessageAnalytics(messageId: number) {
    this.isLoading = true;
    this.messageAnalyticsService
      .getMessageAnalytics(
        messageId,
        this.page,
        this.rows,
        this.sortField,
        this.sortOrder
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: MessageStatsResponse) => {
          // Map API response to stats array
          if (response.success && response.data) {
            const deliveryStats = response.data.deliverystats;
            const responseStats = response.data.responsestats;
            const sentDetails = response.data.sentdetails;
            const totalSent = deliveryStats.totalsent;

            this.deliveryStats = [
              {
                label: 'Total Sent',
                value: totalSent,
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

            // Calculate percentages and set warning classes
            this.calculateSpamPercentage(deliveryStats.spam, totalSent);
            this.calculateBouncePercentage(deliveryStats.bounced, totalSent);

            // Setup chart data (excluding Total Sent from chart)
            this.setupChartData(deliveryStats);
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
            // Dynamically generate columns from first record's memberevents
            if (sentDetails && sentDetails.length > 0) {
              this.generateDynamicColumns(sentDetails[0].memberevents);
            }

            this.tableData = (sentDetails || []).map((detail) => {
              const parsedEvents = JSON.parse(detail.memberevents);
              const rowData: any = {
                email: detail.email,
                issues: detail.issues
                  ? '<span><i class="pi pi-check"></i></span>'
                  : '',
                signedup: detail.signedup
                  ? '<span><i class="pi pi-check"></i></span>'
                  : '',
                memberid: detail.memberid,
              };

              // Add all memberevents fields dynamically
              Object.keys(parsedEvents).forEach((key) => {
                rowData[key.toLowerCase()] = parsedEvents[key];
              });

              return rowData;
            });
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading message analytics:', error);
          this.isLoading = false;
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

  private calculateSpamPercentage(spam: number, totalSent: number): void {
    const result = this.calculatePercentageValue(spam, totalSent);
    this.spamPercent = result.percentage;
    this.spamPercentClass = result.class;
  }

  private calculateBouncePercentage(bounced: number, totalSent: number): void {
    const result = this.calculatePercentageValue(bounced, totalSent);
    this.bouncePercent = result.percentage;
    this.bouncePercentClass = result.class;
  }

  private calculatePercentageValue(
    value: number,
    total: number
  ): { percentage: number; class: 'green' | 'orange' | 'red' } {
    if (value > 0 && total > 0) {
      const percentage = Number(((value / total) * 100).toFixed(2));
      const colorClass = this.getPercentageClass(percentage);
      return { percentage, class: colorClass };
    }
    return { percentage: 0, class: 'green' };
  }

  private getPercentageClass(percentage: number): 'green' | 'orange' | 'red' {
    if (percentage >= PERCENTAGE_THRESHOLDS.WARNING) {
      return 'red';
    } else if (percentage > 0 && percentage < PERCENTAGE_THRESHOLDS.WARNING) {
      return 'orange';
    }
    return 'green';
  }
}
