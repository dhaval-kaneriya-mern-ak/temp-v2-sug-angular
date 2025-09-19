import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SugUiButtonComponent } from '@lumaverse/sug-ui';

@Component({
  selector: 'sug-message-details',
  imports: [CommonModule, SugUiButtonComponent],
  templateUrl: './message_details.html',
  styleUrl: './message_details.scss',
})
export class MessageDetailsComponent {}
