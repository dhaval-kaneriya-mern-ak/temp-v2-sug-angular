import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SugUiMenuTabsComponent, Tabs } from '@lumaverse/sug-ui';
import { Subject, filter, takeUntil } from 'rxjs';

@Component({
  selector: 'sug-tablayout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SugUiMenuTabsComponent],
  templateUrl: './tablayout.html',
  styleUrl: './tablayout.scss',
})
export class TabLayoutComponent implements OnInit, OnDestroy {
  navigationTabs: Tabs[] = [
    { name: 'Dashboard', route: 'messages/dashboard' },
    { name: 'Compose', route: 'messages/compose' },
    { name: 'Draft', route: 'messages/draft' },
    { name: 'Schedule', route: 'messages/schedule' },
    { name: 'Sent', route: 'messages/sent' },
  ];
  currentActiveTab = ''; // Don't hardcode this!

  private router = inject(Router);
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.initializeActiveTab();

    // Listen to router events to update active tab when route changes
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.initializeActiveTab();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeActiveTab() {
    const currentUrl = this.router.url;

    // Find matching tab based on current URL
    const matchingTab = this.navigationTabs.find((tab) => {
      // Special handling for sent details pages (e.g., /messages/sent/123)
      if (
        tab.route === 'messages/sent' &&
        currentUrl.startsWith('/messages/sent/')
      ) {
        return true;
      }

      return (
        currentUrl === `/${tab.route}` ||
        currentUrl.includes(`/${tab.route}`) ||
        currentUrl.endsWith(tab.route) ||
        currentUrl.includes(tab.route)
      );
    });
    this.currentActiveTab = matchingTab
      ? matchingTab.route
      : 'messages/dashboard';
  }

  setActiveTab(tabRoute: string) {
    this.currentActiveTab = tabRoute;
  }

  handleTabSelection(event: Tabs): void {
    let selectedTab: Tabs | null = null;

    if (event && typeof event.route === 'string') {
      selectedTab = event;
    }

    if (selectedTab && selectedTab.route) {
      this.router.navigate([selectedTab.route]);
    }
  }
}
