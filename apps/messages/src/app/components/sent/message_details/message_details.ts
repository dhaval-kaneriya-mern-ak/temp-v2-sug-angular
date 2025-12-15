import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageDetailsService } from './message-details.service';
import { MemberProfile, MessageDetailsData } from '@services/interfaces';
import { SugUiLoadingSpinnerComponent } from '@lumaverse/sug-ui';
import { UserStateService } from '@services/user-state.service';
import { filter, takeUntil, Subject, combineLatest } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'sug-message-details',
  imports: [CommonModule, SugUiLoadingSpinnerComponent],
  templateUrl: './message_details.html',
  styleUrl: './message_details.scss',
})
export class MessageDetailsComponent implements OnInit, OnDestroy {
  messageDetailService = inject(MessageDetailsService);
  sanitizer = inject(DomSanitizer);
  detailsMessage: MessageDetailsData | undefined;
  isLoading = false;
  private userStateService = inject(UserStateService);
  userData: MemberProfile | null = null;
  sanitizedHtmlPreview: SafeHtml = '';
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // Combine user profile and message details to avoid race conditions
    combineLatest([
      this.userStateService.userProfile$.pipe(filter((profile) => !!profile)),
      this.messageDetailService.messageDetails$,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([profile, messageDetails]) => {
        this.userData = profile;

        if (messageDetails) {
          // Create immutable copy to avoid mutating service data
          this.detailsMessage = {
            ...messageDetails,
            sentdate: this.userStateService.convertESTtoUserTZ(
              Number(messageDetails?.sentdate || 0),
              profile?.zonename || 'EST',
              profile?.selecteddateformat?.short.toUpperCase() + ' hh:mma'
            ),
          };

          // Sanitize HTML preview
          this.sanitizedHtmlPreview = this.sanitizer.bypassSecurityTrustHtml(
            this.detailsMessage.preview || ''
          );
          this.isLoading = false;
        } else {
          this.isLoading = true;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Helper method to format date if timestamp is available
  formatSentDate(): string {
    if (!this.detailsMessage) return '';
    // TODO: Add actual timestamp formatting when available in API
    // For now, return a placeholder
    return 'Date not available';
  }
}
