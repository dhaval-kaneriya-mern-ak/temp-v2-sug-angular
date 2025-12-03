import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { SugUiButtonComponent } from '@lumaverse/sug-ui';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'sug-success-page',
  standalone: true,
  imports: [CommonModule, SugUiButtonComponent],
  templateUrl: './success-page.component.html',
  styleUrls: ['./success-page.component.scss'],
})
export class SuccessPageComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  @Input() type: 'send' | 'draft' | 'scheduled' = 'draft';

  ngOnInit(): void {
    // Get query parameters
    this.activatedRoute.queryParams.subscribe((params) => {
      this.type =
        params['type'] === 'send' ||
        params['type'] === 'draft' ||
        params['type'] === 'scheduled'
          ? params['type']
          : 'send';
    });
  }

  composeAnother(): void {
    this.router.navigate(['/messages/compose/email']);
  }

  viewSignUp(): void {
    this.router.navigate(['/signup']);
  }

  viewDrafts(): void {
    this.router.navigate(['/messages/draft']);
  }

  viewSentMessages(): void {
    this.router.navigate(['/messages/sent']);
  }

  viewScheduled(): void {
    this.router.navigate(['/messages/schedule']);
  }
}
