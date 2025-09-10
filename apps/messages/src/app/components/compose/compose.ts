import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SugUiTooltipComponent,
  SugUiDialogComponent,
  DialogConfig,
  SugUiMenuTabsComponent,
  SugUiButtonComponent,
  Tabs,
  // SugUiRadioCheckboxButtonComponent,
} from '@lumaverse/sug-ui';

import { ButtonModule } from 'primeng/button';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'sug-compose',
  imports: [
    CommonModule,
    SugUiTooltipComponent,
    SugUiDialogComponent,
    ButtonModule,
    RouterOutlet,
    SugUiMenuTabsComponent,
    SugUiButtonComponent,
    // SugUiRadioCheckboxButtonComponent,
  ],
  templateUrl: './compose.html',
  styleUrl: './compose.scss',
})
export class Compose {
  navigationComposeTabs: Tabs[] = [
    { name: 'Email', route: 'email' },
    { name: 'Email Template', route: 'template' },
    { name: 'Text Message', route: 'text' },
  ];
  badgeUrl = 'assets/images/pro.webp';
  activeTabRoute: string = this.navigationComposeTabs[0].route;
  onTabChange(selectedTab: Tabs) {
    // Check if the selected tab and its route exist
    if (selectedTab && selectedTab.route) {
      this.activeTabRoute = selectedTab.route;
      console.log('Active tab route:', this.activeTabRoute);
    }
  }
  dialogConf: DialogConfig = {
    modal: true,
    draggable: true,
    resizable: false,
    closable: true,
    closeOnEscape: true,
    dismissableMask: false,
    focusOnShow: true,
    position: 'center',
    appendTo: 'null',
    width: '70vw',
  };
  isVisible = false;
  save() {
    // this.isVisible = false;
  }
}
