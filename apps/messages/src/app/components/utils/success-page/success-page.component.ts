import { CommonModule } from '@angular/common';
import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { SugUiButtonComponent } from '@lumaverse/sug-ui';
import { Router } from '@angular/router';
import { ISignUpItem } from '@services/interfaces';

@Component({
  selector: 'sug-success-page',
  standalone: true,
  imports: [CommonModule, SugUiButtonComponent],
  templateUrl: './success-page.component.html',
  styleUrls: ['./success-page.component.scss'],
})
export class SuccessPageComponent {
  private router = inject(Router);
  @Input() type: 'send' | 'draft' | 'scheduled' | 'custom' = 'draft';
  @Input() showBackToCompose = false;
  @Input() selectedSignups: ISignUpItem[] = [];
  @Output() backToCompose = new EventEmitter<void>();
  @Input() isCustom = false;

  get shouldShowViewSignUpButton(): boolean {
    return this.selectedSignups && this.selectedSignups.length == 1;
  }

  composeAnother(): void {
    if (this.showBackToCompose) {
      this.backToCompose.emit();
    } else {
      this.router.navigate(['/messages/compose/email']);
    }
  }

  viewSignUp(): void {
    if (this.selectedSignups && this.selectedSignups.length === 1) {
      const signup = this.selectedSignups[0] as ISignUpItem;
      if (signup?.urlid) {
        window.location.href = `${window.location.origin}${signup.urlid}`;
      }
    }
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
