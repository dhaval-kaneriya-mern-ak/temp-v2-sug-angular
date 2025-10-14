import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SugUiMenuTabsComponent, Tabs } from '@lumaverse/sug-ui';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router';
@Component({
  selector: 'sug-sent-details',
  imports: [CommonModule, RouterOutlet, SugUiMenuTabsComponent],
  templateUrl: './sent-details.html',
  styleUrl: './sent-details.scss',
})
export class SentDetails {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  navigationComposeTabs: Tabs[] = [
    { name: 'Back', route: '/messages/sent' },
    { name: 'Message Details', route: 'message-details' },
    { name: 'Message Analytics', route: 'message-analytics' },
  ];

  goBack() {
    this.router.navigate(['/messages/sent']);
  }
}
