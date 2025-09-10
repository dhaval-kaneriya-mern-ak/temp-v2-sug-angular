import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'sug-compose-email-template',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compose-email-template.html',
  styleUrls: ['./compose-email-template.scss'],
})
export class ComposeEmailTemplateComponent {
  sendEmail() {
    // In a real app, you would gather form data and send it.
    console.log('Sending email...');
    alert('Email sent! (Check the console)');
  }
}
