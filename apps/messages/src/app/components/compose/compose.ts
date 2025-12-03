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
import { takeUntil } from 'rxjs/operators';
import { UserStateService } from '@services/user-state.service';
interface ComposeTab extends Tabs {
  restricted?: boolean;
  badge?: string;
}
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
  private userStateService = inject(UserStateService);
  composeService = inject(ComposeService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  public currentActiveTab = '';
  public isProUser = false;
  public isTrialUser = false;
  public isVisible = false;
  public dialogType: 'template' | 'text' | null = null;
  public isSuccessRoute = false;

  // Navigation tabs
  navigationComposeTabs: ComposeTab[] = [
    {
      name: 'Email',
      route: 'messages/compose/email',
      restricted: false,
    },
    {
      name: 'Email Template',
      route: 'messages/compose/template',
      restricted: true,
    },
    {
      name: 'Text Message',
      route: 'messages/compose/text',
      restricted: true,
    },
  ];

  // Component properties
  public badgeUrl = 'assets/images/pro.webp';
  public activeTabRoute: string = this.navigationComposeTabs[0].route;

  ngOnInit() {
    this.initializeActiveTab();
    this.checkIfSuccessRoute();

    // Subscribe to router events to detect route changes
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkIfSuccessRoute();
    });

    this.userStateService.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((profile) => {
        if (!profile) return;

        this.isProUser = profile.ispro ?? false;
        this.isTrialUser = profile.istrial ?? false;
        this.checkDirectAccess();
      });
  }

  private checkIfSuccessRoute() {
    this.isSuccessRoute = this.router.url.includes('/success');
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

  private checkDirectAccess() {
    const currentUrl = this.router.url;
    const activeTab = this.navigationComposeTabs.find((tab) =>
      currentUrl.includes(tab.route)
    );

    if (!activeTab) return;

    const isAllowed = this.isProUser || this.isTrialUser;

    if (activeTab.restricted && !isAllowed) {
      if (currentUrl.includes('template')) {
        this.dialogType = 'template';
      } else {
        this.dialogType = 'text';
      }

      this.isVisible = true;
    }
  }

  handleTabSelection(event: ComposeTab): void {
    const selectedTab = event as ComposeTab;
    if (!selectedTab || !selectedTab.route) {
      this.currentActiveTab = this.activeTabRoute;
      this.router.navigateByUrl('/' + this.activeTabRoute);
      return;
    }

    const isRestricted = selectedTab.restricted ?? false;
    const isAllowed = this.isProUser || this.isTrialUser;

    if (isRestricted && !isAllowed) {
      if (selectedTab.route.includes('template')) {
        this.dialogType = 'template';
      } else if (selectedTab.route.includes('text')) {
        this.dialogType = 'text';
      }

      this.isVisible = true;
      return;
    }

    this.currentActiveTab = selectedTab.route || this.activeTabRoute;
    this.router.navigateByUrl('/' + this.currentActiveTab);
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

  hideDialog() {
    this.isVisible = false;
    this.currentActiveTab = this.activeTabRoute;
    this.router
      .navigateByUrl('/', { skipLocationChange: true })
      .then(() => this.router.navigateByUrl('/' + this.currentActiveTab));
  }
}
