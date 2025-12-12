import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageDetailsService } from './message-details.service';
import { ActivatedRoute } from '@angular/router';
import { MemberProfile, MessageDetailsData } from '@services/interfaces';
import { SugUiLoadingSpinnerComponent } from '@lumaverse/sug-ui';
import { UserStateService } from '@services/user-state.service';
import { filter, take } from 'rxjs';

@Component({
  selector: 'sug-message-details',
  imports: [CommonModule, SugUiLoadingSpinnerComponent],
  templateUrl: './message_details.html',
  styleUrl: './message_details.scss',
})
export class MessageDetailsComponent implements OnInit {
  messageDetailService = inject(MessageDetailsService);
  activatedRoute = inject(ActivatedRoute);
  detailsMessage: MessageDetailsData | undefined;
  isLoading = false;
  private userStateService = inject(UserStateService);
  userData: MemberProfile | null = null;
  ngOnInit() {
    // Get ID from parent route params
    const messageId = this.activatedRoute.parent?.snapshot.params['id'];

    this.userStateService.userProfile$
      .pipe(
        filter((profile) => !!profile),
        take(1)
      )
      .subscribe((profile) => {
        this.userData = profile;
        if (messageId) {
          this.getMessageDetails(+messageId); // Convert string to number
        }
      });
  }

  getMessageDetails(messageId: number) {
    this.isLoading = true;
    this.messageDetailService.getMessageDetails(messageId).subscribe({
      next: (response) => {
        this.detailsMessage = response.data;
        this.detailsMessage.sentdate = this.userStateService.convertESTtoUserTZ(
          Number(response?.data?.sentdate || 0),
          this.userData?.zonename || 'UTC',
          this.userData?.selecteddateformat?.short.toUpperCase() + ' hh:mma'
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading message details:', error);
        this.isLoading = false;
      },
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
