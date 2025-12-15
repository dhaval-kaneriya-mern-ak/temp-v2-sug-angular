import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageDetailsService } from './message-details.service';
import { ActivatedRoute } from '@angular/router';
import { MemberProfile, MessageDetailsData } from '@services/interfaces';
import { SugUiLoadingSpinnerComponent } from '@lumaverse/sug-ui';
import { UserStateService } from '@services/user-state.service';
import { filter, take } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'sug-message-details',
  imports: [CommonModule, SugUiLoadingSpinnerComponent],
  templateUrl: './message_details.html',
  styleUrl: './message_details.scss',
})
export class MessageDetailsComponent implements OnInit {
  messageDetailService = inject(MessageDetailsService);
  activatedRoute = inject(ActivatedRoute);
  sanitizer = inject(DomSanitizer);
  detailsMessage: MessageDetailsData | undefined;
  isLoading = false;
  private userStateService = inject(UserStateService);
  userData: MemberProfile | null = null;
  sanitizedHtmlPreview: SafeHtml = '';

  ngOnInit() {
    // Get user profile for date formatting
    this.userStateService.userProfile$
      .pipe(
        filter((profile) => !!profile),
        take(1)
      )
      .subscribe((profile) => {
        this.userData = profile;
      });

    // Get message details from service (already loaded by parent component)
    this.messageDetailService.messageDetails$.subscribe((messageDetails) => {
      if (messageDetails) {
        this.detailsMessage = messageDetails;

        // Format date if we have user data
        if (this.userData && this.detailsMessage) {
          this.detailsMessage.sentdate =
            this.userStateService.convertESTtoUserTZ(
              Number(this.detailsMessage?.sentdate || 0),
              this.userData?.zonename || 'EST',
              this.userData?.selecteddateformat?.short.toUpperCase() + ' hh:mma'
            );
        }

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

  // Helper method to format date if timestamp is available
  formatSentDate(): string {
    if (!this.detailsMessage) return '';
    // TODO: Add actual timestamp formatting when available in API
    // For now, return a placeholder
    return 'Date not available';
  }
}
