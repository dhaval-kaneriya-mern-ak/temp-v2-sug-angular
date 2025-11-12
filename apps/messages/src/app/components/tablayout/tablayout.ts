import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SugUiMenuTabsComponent, Tabs } from '@lumaverse/sug-ui';
import { Subject, filter, take, takeUntil } from 'rxjs';
import { MemberProfile } from '@services/interfaces';
import { UserStateService } from '@services/user-state.service';

@Component({
  selector: 'sug-tablayout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SugUiMenuTabsComponent],
  templateUrl: './tablayout.html',
  styleUrl: './tablayout.scss',
})
export class TabLayoutComponent implements OnInit, OnDestroy {
  private readonly allTabs: Tabs[] = [
    { name: 'Dashboard', route: 'messages/dashboard' },
    { name: 'Compose', route: 'messages/compose' },
    { name: 'Drafts & Templates', route: 'messages/draft' },
    { name: 'Scheduled', route: 'messages/schedule' },
    { name: 'Sent', route: 'messages/sent' },
  ];

  navigationTabs: Tabs[] = [];
  currentActiveTab = '';
  showAnnouncementBar = false;

  private readonly userStateService = inject(UserStateService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  constructor() {
    this.checkAnnouncementBarVisibility();
  }

  ngOnInit() {
    this.initializeActiveTab();
    this.loadUserProfileAndUpdateTabs();

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

  private loadUserProfileAndUpdateTabs(): void {
    // Subscribe to profile changes - NO API call triggered here
    // The header component already triggers the API call
    this.userStateService.userProfile$
      .pipe(
        filter((profile) => !!profile),
        take(1)
      )
      .subscribe({
        next: (profile) => {
          this.updateNavigationTabs(profile);
          this.initializeActiveTab();
        },
        error: () => {
          this.navigationTabs = [...this.allTabs];
          this.initializeActiveTab();
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateNavigationTabs(profile: MemberProfile | null): void {
    // Simple tab filtering
    this.navigationTabs = this.allTabs.filter(
      (tab) =>
        tab.route !== 'messages/schedule' ||
        this.userStateService.shouldShowScheduleTab(profile)
    );
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

  /**
   * Check if the announcement bar should be visible based on the 'sugrcemsgs' cookie
   */
  private checkAnnouncementBarVisibility(): void {
    const cookieValue = this.getCookie('sugrcemsgs');
    this.showAnnouncementBar = cookieValue === 'true';
  }

  /**
   * Get a cookie value by name
   */
  private getCookie(name: string): string {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return '';
  }

  /**
   * Set a cookie
   */
  private setCookie(name: string, value: string, days?: number): void {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie =
      name + '=' + value + expires + '; path=/; SameSite=None; Secure';
  }

  /**
   * Handle the "Go Back" click - redirect to classic version and set cookie to false
   */
  goBackToClassic(event: Event): void {
    event.preventDefault();
    this.deleteCookie('sugrcemsgs');
    window.location.href = '/index.cfm?go=t.messageCenter#/';
  }

  /**
   * Delete a cookie
   */
  private deleteCookie(name: string): void {
    document.cookie =
      name + '=; Path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}
