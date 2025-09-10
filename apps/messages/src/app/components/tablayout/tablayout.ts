import { Component, inject } from '@angular/core'; // Import inject
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
export class TabLayoutComponent {
  navigationTabs: Tabs[] = [
    { name: 'Dashboard', route: 'dashboard' },
    { name: 'Compose', route: 'compose' },
    { name: 'Draft', route: 'draft' },
    { name: 'Schedule', route: 'schedule' },
    { name: 'Sent', route: 'sent' },
  ];

  private router = inject(Router);

  /**
   * More robust event handler to find the selected tab data and navigate.
   * This is more likely to be "error-free" as it checks multiple common event structures.
   */
  handleTabSelection(event: any): void {
    let selectedTab: Tabs | null = null;

    // The component might emit the data in a few common ways.
    // We check them in order of likelihood.

    // 1. Check if the data is in `event.detail` (common for custom events)
    if (event && event.detail && typeof event.detail.route === 'string') {
      selectedTab = event.detail;
    }
    // 2. Check if the event itself is the data object
    else if (event && typeof event.route === 'string') {
      selectedTab = event;
    }

    // Now, navigate if we found a valid tab with a route
    if (selectedTab && selectedTab.route) {
      this.router.navigate([selectedTab.route]);
    } else {
      // This will log a warning if the data structure is still not recognized.
      console.warn(
        'Could not determine a valid route from the tab selection event:',
        event
      );
    }
  }
}
