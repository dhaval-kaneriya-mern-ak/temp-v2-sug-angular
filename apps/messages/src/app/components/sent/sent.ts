import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ISugTableConfig, ISugTableColumn } from '@lumaverse/sug-ui';
import { BadgeModule } from 'primeng/badge';
import { HttpClientModule } from '@angular/common/http';
import { SugUiTableComponent, SugUiButtonComponent } from '@lumaverse/sug-ui';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { SugUiMenuTabsComponent, Tabs } from '@lumaverse/sug-ui';

@Component({
  selector: 'sug-sent',
  imports: [
    CommonModule,
    SugUiTableComponent,
    SugUiButtonComponent,
    RouterOutlet,
    SugUiMenuTabsComponent,
    ButtonModule,
    BadgeModule,
    HttpClientModule,
  ],
  templateUrl: './sent.html',
  styleUrl: './sent.scss',
})
export class Sent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

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
      header: ' ',
      sortable: false,
      filterable: false,
    },
  ];

  tableData = [
    {
      sent: '06/20/2025 10:08am',
      subject: `<div class="subject-text">
                  <span class="subject-text">Sign Up Invite</span>
                  <span class="sub-text">Invite - Multiple Sign Ups</span>
                </div>`,
      sentTo: '7',
      status: 'Completed',
      action: `<div class="table-action-wrapper">
                  <a href="#" class="btn-action"><i class="pi pi-chart-bar"></i></a>
                </div>`,
    },
    {
      sent: '08/06/2025 10:31am',
      subject: `<div class="subject-text">
                  <span class="subject-text">test</span>
                  <span class="sub-text">Bulk - test</span>
                </div>`,
      sentTo: '7',
      status: 'Completed',
      action: `<div class="table-action-wrapper">
                  <a href="#" class="btn-action"><i class="pi pi-chart-bar"></i></a>
                </div>`,
    },
    {
      sent: '08/06/2025 10:09am',
      subject: `<div class="subject-text">
                  <span class="subject-text">Venmo Invite</span>
                  <span class="sub-text">Invite - Venmo</span>
                </div>`,
      sentTo: '5',
      status: 'Completed',
      action: `<div class="table-action-wrapper">
                  <a href="#" class="btn-action"><i class="pi pi-chart-bar"></i></a>
                </div>`,
    },
    {
      sent: '08/06/2025 10:09am',
      subject: `<div class="subject-text">
                  <span class="subject-text">test Invite</span>
                  <span class="sub-text">Invite - test</span>
                </div>`,
      sentTo: '5',
      status: 'Completed',
      action: `<div class="table-action-wrapper">
                  <a href="#" class="btn-action"><i class="pi pi-chart-bar"></i></a>
                </div>`,
    },
  ];
  onSort() {
    // Handle sorting if needed
  }

  onFilter() {
    // Handle filtering if needed
  }

  onPage() {
    // Handle pagination if needed
  }
  navigationComposeTabs: Tabs[] = [
    { name: 'Message Details', route: 'message-details' },
    { name: 'Message Analytics', route: 'message-analytics' },
  ];
  activeTabRoute: string = this.navigationComposeTabs[0].route;
}
