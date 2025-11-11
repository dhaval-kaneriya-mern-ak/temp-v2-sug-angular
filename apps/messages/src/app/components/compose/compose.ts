import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SugUiTooltipComponent,
  SugUiDialogComponent,
  DialogConfig,
  SugUiMenuTabsComponent,
  SugUiButtonComponent,
  Tabs,
} from '@lumaverse/sug-ui';

import { ButtonModule } from 'primeng/button';
import { Router, RouterOutlet } from '@angular/router';
import { ComposeService } from './compose.service';
import { Subject } from 'rxjs';

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
export class Compose implements OnInit, OnDestroy {
  composeService = inject(ComposeService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Navigation tabs
  navigationComposeTabs: Tabs[] = [
    { name: 'Email', route: 'messages/compose/email' },
    { name: 'Email Template', route: 'messages/compose/template' },
    { name: 'Text Message', route: 'messages/compose/text' },
  ];

  // Component properties
  badgeUrl = 'assets/images/pro.webp';
  activeTabRoute: string = this.navigationComposeTabs[0].route;

  currentActiveTab = ''; // Don't hardcode this!

  ngOnInit() {
    // Initialize active tab based on current route
    this.initializeActiveTab();
  }

  ngOnDestroy() {
    // Cleanup all subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeActiveTab() {
    const currentUrl = this.router.url;

    // Find matching tab based on current URL
    const matchingTab = this.navigationComposeTabs.find((tab) => {
      return (
        currentUrl === `/${tab.route}` ||
        currentUrl.includes(`/${tab.route}`) ||
        currentUrl.endsWith(tab.route) ||
        currentUrl.includes(tab.route)
      );
    });

    this.currentActiveTab = matchingTab ? matchingTab.route : 'email';
  }

  setActiveTab(tabRoute: string) {
    this.currentActiveTab = tabRoute;
  }

  handleTabSelection(event: any): void {
    let selectedTab: Tabs | null = null;

    if (event && typeof event.route === 'string') {
      selectedTab = event;
    }

    if (selectedTab && selectedTab.route) {
      this.router.navigate([selectedTab.route]);
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
}
