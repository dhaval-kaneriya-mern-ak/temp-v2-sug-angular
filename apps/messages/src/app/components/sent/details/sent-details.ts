import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SugUiMenuTabsComponent, Tabs } from '@lumaverse/sug-ui';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router';
@Component({
  selector: 'sug-sent-details',
  imports: [CommonModule, RouterOutlet, SugUiMenuTabsComponent],
  templateUrl: './sent-details.html',
  styleUrl: './sent-details.scss',
})
export class SentDetails implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  navigationComposeTabs: Tabs[] = [
    { name: 'Back', route: '/messages/sent' },
    { name: 'Message Details', route: 'details' },
    { name: 'Message Analytics', route: 'analytics' },
  ];
  messageId = '';
  currentActiveTab = 'details'; // Don't hardcode this!
  ngOnInit() {
    // Initialize active tab based on current route
    this.initializeActiveTab();
    this.route.params.subscribe((params) => {
      this.messageId = params['id'] || '';
    });
  }
  initializeActiveTab() {
    const currentUrl = this.router.url;

    // Check for specific URL patterns to determine active tab
    if (currentUrl.includes('/details')) {
      this.currentActiveTab = 'details';
    } else if (currentUrl.includes('/analytics')) {
      this.currentActiveTab = 'analytics';
    } else if (
      currentUrl === '/messages/sent' ||
      (currentUrl.includes('/messages/sent') &&
        !currentUrl.includes('/analytics') &&
        !currentUrl.includes('/details'))
    ) {
      this.currentActiveTab = ''; // Back tab or sent list
    } else {
      this.currentActiveTab = 'details';
    }
  }

  handleTabSelection(event: Tabs): void {
    let selectedTab: Tabs | null = null;

    if (event && typeof event.route === 'string') {
      selectedTab = event;
    }

    if (selectedTab && selectedTab.route) {
      // Handle Back button with absolute navigation
      if (selectedTab.name === 'Back') {
        this.router.navigate(['/messages/sent']);
      }
      if (selectedTab.route === 'details') {
        this.router.navigate([`/messages/sent/${this.messageId}/details`]);
      }
      if (selectedTab.route === 'analytics') {
        this.router.navigate([`/messages/sent/${this.messageId}/analytics`]);
      }
    }
  }
}
