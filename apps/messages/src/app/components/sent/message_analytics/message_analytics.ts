import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SugUiDeliveryStatsComponent,
  DeliveryStatsItem,
  SugUiTableComponent,
} from '@lumaverse/sug-ui';
import { ISugTableConfig, ISugTableColumn } from '@lumaverse/sug-ui';

@Component({
  selector: 'sug-message-analytics',
  imports: [CommonModule, SugUiDeliveryStatsComponent, SugUiTableComponent],
  templateUrl: './message_analytics.html',
  styleUrl: './message_analytics.scss',
})
export class MessageAnalyticsComponent {
  stats: DeliveryStatsItem[] = [
    { label: 'Total Sent', value: 13, badgeColor: 'black' },
    { label: 'Delivered', value: 6, badgeColor: 'green' },
    { label: 'Bounced', value: 0, badgeColor: 'yellow' },
    { label: 'Dropped', value: 0, badgeColor: 'orange' },
    { label: 'Spam', value: 0, badgeColor: 'red' },
  ];
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
      field: 'signedUp',
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

  tableData = [
    {
      email: 'redcrab@skylark.net',
      status: 'Completed',
      issues: `<span><i class="pi pi-check"></i></span>`,
      signedUp: `<span><i class="pi pi-check"></i></span>`,
      opened: `<span><i class="pi pi-check"></i></span>`,
      clicked: `<span><i class="pi pi-check"></i></span>`,
    },
    {
      email: 'myuser@skylark.net',
      status: 'Completed',
      issues: `<span><i class="pi pi-check"></i></span>`,
      signedUp: `<span><i class="pi pi-check"></i></span>`,
      opened: `<span><i class="pi pi-check"></i></span>`,
      clicked: `<span><i class="pi pi-check"></i></span>`,
    },
    {
      email: 'purplebank@skylark.net',
      status: 'Completed',
      issues: `<span><i class="pi pi-check"></i></span>`,
      signedUp: `<span><i class="pi pi-check"></i></span>`,
      opened: `<span><i class="pi pi-check"></i></span>`,
      clicked: `<span><i class="pi pi-check"></i></span>`,
    },
    {
      email: 'youruser@skylark.net',
      status: 'Completed',
      issues: `<span><i class="pi pi-check"></i></span>`,
      signedUp: `<span><i class="pi pi-check"></i></span>`,
      opened: `<span><i class="pi pi-check"></i></span>`,
      clicked: `<span><i class="pi pi-check"></i></span>`,
    },
    {
      email: 'testfreenocoupon@skylark.net',
      status: 'Completed',
      issues: `<span><i class="pi pi-check"></i></span>`,
      signedUp: `<span><i class="pi pi-check"></i></span>`,
      opened: `<span><i class="pi pi-check"></i></span>`,
      clicked: `<span><i class="pi pi-check"></i></span>`,
    },
    {
      email: 'alygold@skylark.net',
      status: 'Completed',
      issues: `<span><i class="pi pi-check"></i></span>`,
      signedUp: `<span><i class="pi pi-check"></i></span>`,
      opened: `<span><i class="pi pi-check"></i></span>`,
      clicked: `<span><i class="pi pi-check"></i></span>`,
    },
  ];
  onSort() {
    // Handle sorting if needed
  }

  onPage() {
    // Handle pagination if needed
  }
}
