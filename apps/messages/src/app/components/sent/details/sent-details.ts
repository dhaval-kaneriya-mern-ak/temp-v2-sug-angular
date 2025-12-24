import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SugUiMenuTabsComponent, Tabs } from '@lumaverse/sug-ui';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { MessageDetailsService } from '../message_details/message-details.service';
import { MemberProfile, MessageDetailsData } from '@services/interfaces';
import { UserStateService } from '@services/user-state.service';
import { filter, take, takeUntil, Subject } from 'rxjs';
@Component({
  selector: 'sug-sent-details',
  imports: [CommonModule, RouterOutlet, SugUiMenuTabsComponent],
  templateUrl: './sent-details.html',
  styleUrl: './sent-details.scss',
})
export class SentDetails implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageDetailService = inject(MessageDetailsService);
  private userStateService = inject(UserStateService);
  private destroy$ = new Subject<void>();

  navigationComposeTabs: Tabs[] = [
    { name: 'Back', route: '/messages/sent' },
    { name: 'Message Details', route: 'details' },
    { name: 'Message Analytics', route: 'analytics' },
  ];
  messageId = '';
  currentActiveTab = 'details'; // Don't hardcode this!
  detailsMessage: MessageDetailsData | undefined;
  ngOnInit() {
    // Initialize active tab based on current route
    this.initializeActiveTab();

    // Then get message ID from route and load message details
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.messageId = params['id'] || '';
      if (this.messageId) {
        this.getMessageDetails(+this.messageId);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getMessageDetails(messageId: number) {
    // Clear previous message details to prevent showing old data
    this.messageDetailService.clearMessageDetails();
    this.detailsMessage = undefined;

    this.messageDetailService
      .getMessageDetails(messageId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.detailsMessage = response.data;
        },
        error: (error) => {
          console.error('Error loading message details:', error);
          // Clear details on error to prevent showing stale data
          this.messageDetailService.clearMessageDetails();
          this.detailsMessage = undefined;
        },
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
