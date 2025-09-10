import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SugUiProgressBarComponent,
  SugUiTableComponent,
  SugUiButtonComponent,
} from '@lumaverse/sug-ui';
import { ISugTableConfig, ISugTableColumn } from '@lumaverse/sug-ui';

@Component({
  selector: 'sug-dashboard',
  imports: [
    CommonModule,
    SugUiProgressBarComponent,
    SugUiTableComponent,
    SugUiButtonComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  emailMessagesUsedToday = 'Loading files..';
  progressone = '0 / 10,000 email messages used today';
  progresstwo = '0 / 20 email messages used this month';
  progressthree = '0 / 14 text messages used this month';

  tableData: any[] = [];
  selectedItems: any[] = [];
  tableConfig: ISugTableConfig = {};

  tableColumns: ISugTableColumn[] = [
    {
      field: 'dateSent',
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
      header: '	Sent To',
      sortable: true,
      filterable: false,
      width: '200px',
    },
    {
      field: 'chart',
      header: '',
      sortable: false,
      filterable: false,
      width: '40px',
    },
  ];

  ngOnInit(): void {
    // 2. PROVIDE DATA FOR THE TABLE
    this.tableData = [
      {
        dateSent: '01/07/2025 10:23am',
        subject: 'john.doe@example.com',
        sentTo: 'All Group Members Only',
        chart: '<a href="#"><i class="pi pi-chart-bar"></i></a>',
      },
      {
        dateSent: '08/06/2025 9:16am	',
        subject: 'jane.smith@example.com',
        sentTo: 'All Group Members Only',
        chart: '<a href="#"><i class="pi pi-chart-bar"></i></a>',
      },
      {
        dateSent: '08/06/2025 10:09am	',
        subject: 'sam.wilson@example.com',
        sentTo: 'People Who Have Not Signed Up',
        chart: '<a href="#"><i class="pi pi-chart-bar"></i></a>',
      },
      {
        dateSent: '08/27/2025 6:05am',
        subject: 'sam.wilson@example.com',
        sentTo: 'Select Members',
        chart: '<a href="#"><i class="pi pi-chart-bar"></i></a>',
      },
      {
        dateSent: '08/06/2025 10:09am',
        subject: 'sam.wilson@example.com',
        sentTo: 'Select Members',
        chart: '<a href="#"><i class="pi pi-chart-bar"></i></a>',
      },
    ];
  }

  onSelectionChange(event: any): void {
    console.log('Selected items:', this.selectedItems);
  }
}
