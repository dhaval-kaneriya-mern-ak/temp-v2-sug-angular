import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'sug-compose-text-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compose-text-message.html',
  styleUrls: ['./compose-text-message.scss'],
})
export class ComposeTextMessageComponent {
  sendEmail() {
    // In a real app, you would gather form data and send it.
    console.log('Sending email...');
    alert('Email sent! (Check the console)');
  }
}
