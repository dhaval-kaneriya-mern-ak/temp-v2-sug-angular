import { Component, inject, OnInit } from '@angular/core'; // Add OnInit
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { SugUiMenuTabsComponent, Tabs } from '@lumaverse/sug-ui';

@Component({
  selector: 'sug-tablayout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SugUiMenuTabsComponent],
  templateUrl: './tablayout.html',
  styleUrl: './tablayout.scss',
})
export class TabLayoutComponent implements OnInit {
  navigationTabs: Tabs[] = [
    { name: 'Dashboard', route: 'messages/dashboard' },
    { name: 'Compose', route: 'messages/compose' },
    { name: 'Draft', route: 'messages/draft' },
    { name: 'Schedule', route: 'messages/schedule' },
    { name: 'Sent', route: 'messages/sent' },
  ];
  currentActiveTab = ''; // Don't hardcode this!

  private router = inject(Router);

  ngOnInit() {
    // Initialize active tab based on current route
    this.initializeActiveTab();
  }

  private initializeActiveTab() {
    const currentUrl = this.router.url;

    // Find matching tab based on current URL
    const matchingTab = this.navigationTabs.find((tab) => {
      return (
        currentUrl === `/${tab.route}` ||
        currentUrl.includes(`/${tab.route}`) ||
        currentUrl.endsWith(tab.route) ||
        currentUrl.includes(tab.route)
      );
    });

    this.currentActiveTab = matchingTab ? matchingTab.route : 'dashboard';
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
}
