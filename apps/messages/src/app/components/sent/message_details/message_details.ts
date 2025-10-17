import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageDetailsService } from './message-details.service';
import { ActivatedRoute } from '@angular/router';
import { MessageDetailsData } from '@services/interfaces';
import { SugUiLoadingSpinnerComponent } from '@lumaverse/sug-ui';

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
  ngOnInit() {
    // Get ID from parent route params
    const messageId = this.activatedRoute.parent?.snapshot.params['id'];
    if (messageId) {
      this.getMessageDetails(+messageId); // Convert string to number
    }
  }

  getMessageDetails(messageId: number) {
    this.isLoading = true;
    this.messageDetailService.getMessageDetails(messageId).subscribe({
      next: (response) => {
        this.detailsMessage = response.data;
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
