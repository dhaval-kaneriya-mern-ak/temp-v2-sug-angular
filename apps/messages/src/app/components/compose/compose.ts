import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
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
import {
  Router,
  RouterOutlet,
  NavigationEnd,
  NavigationCancel,
} from '@angular/router';
import { ComposeService } from './compose.service';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { UserStateService } from '@services/user-state.service';
import { SuccessPageComponent } from '../utils/success-page/success-page.component';
import { ISignUpItem } from '@services/interfaces';
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
    SuccessPageComponent,
    // SugUiRadioCheckboxButtonComponent,
  ],
  templateUrl: './compose.html',
  styleUrl: './compose.scss',
})
export class Compose implements OnInit, OnDestroy {
  private userStateService = inject(UserStateService);
  composeService = inject(ComposeService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();
  public currentActiveTab = '';
  public isProUser = false;
  public isTrialUser = false;
  public isVisible = false;
  public isOptionSelected = false;
  public dialogType: 'template' | 'text' | null = null;
  public isSuccessRoute = false;
  isShowSuccessPage = false;
  successPageType: 'send' | 'draft' | 'scheduled' | 'custom' = 'send';
  successPageSelectedSignups: ISignUpItem[] = [];

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
  public badgeUrl = '/assets/images/pro.jpg';
  public activeTabRoute: string = this.navigationComposeTabs[0].route;

  ngOnInit() {
    this.initializeActiveTab();
    this.checkIfSuccessRoute();

    // Subscribe to router events to detect route changes and update active tab
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.checkIfSuccessRoute();
        // Update active tab based on actual route after navigation completes
        this.initializeActiveTab();
      });

    // Listen for navigation cancellation (e.g., when guard prevents navigation)
    // and force the tab component to reset back to the current tab
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationCancel),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Force the menu tabs component to re-render with the current active tab
        // by temporarily clearing and then restoring the value
        const currentTab = this.currentActiveTab;
        this.currentActiveTab = '';
        this.cdr.detectChanges();
        this.currentActiveTab = currentTab;
        this.cdr.detectChanges();
      });

    this.userStateService.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((profile) => {
        if (!profile) return;

        this.isProUser = profile.ispro ?? false;
        this.isTrialUser = profile.istrial ?? false;

        // Always set badge on restricted tabs
        this.navigationComposeTabs = this.navigationComposeTabs.map((tab) => {
          if (tab.restricted && this.userStateService.isBasicUser(profile)) {
            return { ...tab, badge: this.badgeUrl };
          }
          return tab;
        });

        this.checkDirectAccess();
      });

    // Subscribe to success page events from compose service
    this.composeService.showSuccessPage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data && data.type) {
          this.showSuccessPageWithType(data.type, data.selectedSignups);
        }
      });

    // Subscribe to option selection changes
    this.composeService.isOptionSelected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isSelected) => {
        this.isOptionSelected = isSelected;
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

    const activeRoute = matchingTab
      ? matchingTab.route
      : 'messages/compose/email';
    this.currentActiveTab = activeRoute;
    this.activeTabRoute = activeRoute;
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
      this.router.navigateByUrl('/' + this.activeTabRoute);
      return;
    }

    // Reset option selection when changing tabs
    this.isOptionSelected = false;
    this.composeService.setOptionSelected(false);

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

    // Navigate to the selected tab - currentActiveTab will be updated automatically
    // after successful navigation via the NavigationEnd event subscription
    this.router.navigateByUrl('/' + selectedTab.route);
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

  showSuccessPageWithType(
    type: 'send' | 'draft' | 'scheduled' | 'custom',
    selectedSignups?: ISignUpItem[]
  ) {
    this.successPageType = type;
    this.successPageSelectedSignups = selectedSignups || [];
    this.isShowSuccessPage = true;
    window.scrollTo(0, 0);
  }

  hideSuccessPage() {
    this.isShowSuccessPage = false;
  }
}
