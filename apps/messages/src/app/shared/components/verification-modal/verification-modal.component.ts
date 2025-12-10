import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  inject,
  ViewEncapsulation,
  AfterViewInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DialogConfig,
  SugUiButtonComponent,
  SugUiDialogComponent,
} from '@lumaverse/sug-ui';
import { VerificationService } from '@services/verification.service';
import { UserStateService } from '@services/user-state.service';

/**
 * Verification Modal Component
 * Displays a modal to verify user account with a 6-digit code
 * Styled to match the existing confirmation dialog theme
 */
@Component({
  selector: 'sug-verification-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SugUiDialogComponent,
    SugUiButtonComponent,
  ],
  templateUrl: './verification-modal.component.html',
  styleUrls: ['./verification-modal.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class VerificationModalComponent implements OnChanges, AfterViewInit {
  @Input() visible = false;
  @Output() verified = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly verificationService = inject(VerificationService);
  private readonly userStateService = inject(UserStateService);

  verificationCode = '';
  isLoading = false;
  errorMessage = '';
  otpDigits: string[] = ['', '', '', '', '', ''];

  dialogConfig: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: false,
    dismissableMask: false,
    visible: this.visible,
    appendTo: 'body',
    position: 'center',
    width: '654px',
  };

  ngOnChanges(changes: SimpleChanges): void {
    // Call API every time modal opens
    if (changes['visible'] && this.visible) {
      this.resetForm();
      this.sendCode();
      // Auto-focus first input after a short delay to ensure modal is rendered
      setTimeout(() => {
        this.focusFirstInput();
      }, 300);
    }
  }

  ngAfterViewInit(): void {
    // Focus first input when component is initialized
    if (this.visible) {
      this.focusFirstInput();
    }
  }

  /**
   * Send verification code to user's email
   */
  private sendCode(): void {
    this.verificationService.sendVerificationCode().subscribe({
      next: () => {
        console.log('Verification code sent to email');
      },
      error: (err) => {
        console.error('Failed to send verification code:', err);
        this.errorMessage =
          'Failed to send verification code. Please try again.';
      },
    });
  }

  /**
   * Handle continue button click - verify the code
   */
  onContinue(): void {
    // Build verification code from digits
    this.verificationCode = this.otpDigits.join('');

    // Validate code format
    if (!this.verificationCode || this.verificationCode.trim().length !== 6) {
      this.errorMessage =
        'Enter a valid verification code or click the activation link in the verification email.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Step 1: Validate the verification code
    this.verificationService
      .validateVerificationCode(this.verificationCode.trim())
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Step 2: Code verified successfully - now fetch updated verification status
            this.verificationService.checkVerificationStatus().subscribe({
              next: (verified: number) => {
                // Update verification status from server response
                this.userStateService.setVerificationStatus(verified);
                this.isLoading = false;
                this.visible = false;
                this.visibleChange.emit(false);
                this.verified.emit();
              },
              error: (err) => {
                console.error('Failed to fetch verification status:', err);
                // Fallback: Still set to verified since code was accepted
                this.userStateService.setVerificationStatus(1);
                this.isLoading = false;
                this.visible = false;
                this.visibleChange.emit(false);
                this.verified.emit();
              },
            });
          } else {
            this.errorMessage =
              'Enter a valid verification code or click the activation link in the verification email.';
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('Verification failed:', err);
          this.errorMessage =
            'Enter a valid verification code or click the activation link in the verification email.';
          this.isLoading = false;
        },
      });
  }

  /**
   * Handle modal close (X button)
   */
  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.closed.emit();
  }

  /**
   * Reset form state
   */
  private resetForm(): void {
    this.verificationCode = '';
    this.otpDigits = ['', '', '', '', '', ''];
    this.errorMessage = '';
    this.isLoading = false;
  }

  /**
   * Handle OTP input for individual boxes
   * @param event - Input event
   * @param index - Index of the OTP digit (0-5)
   */
  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, ''); // Only allow numbers

    if (value.length > 0) {
      // Set the digit at current index
      this.otpDigits[index] = value.charAt(value.length - 1);
      input.value = this.otpDigits[index];

      // Auto-focus next input
      if (index < 5) {
        const nextInput = input.nextElementSibling as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      }
    } else {
      this.otpDigits[index] = '';
    }

    // Clear error when user starts typing
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  /**
   * Handle keydown to prevent non-numeric keys and handle backspace
   * @param event - Keyboard event
   * @param index - Index of the OTP digit (0-5)
   */
  onOtpKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    // Allow: backspace, delete, tab, escape, enter, arrow keys
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
    ];

    // Allow Ctrl/Cmd shortcuts (for copy/paste)
    if (event.ctrlKey || event.metaKey) {
      return;
    }

    // Check if key is allowed or is a number (0-9)
    const isNumber = /^[0-9]$/.test(event.key);
    const isAllowedKey = allowedKeys.includes(event.key);

    // If not a number and not an allowed key, prevent input
    if (!isNumber && !isAllowedKey) {
      event.preventDefault();
      return;
    }

    // Handle backspace
    if (event.key === 'Backspace') {
      if (this.otpDigits[index] === '' && index > 0) {
        // If current box is empty and backspace pressed, go to previous box
        const prevInput = input.previousElementSibling as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
          this.otpDigits[index - 1] = '';
          prevInput.value = '';
        }
      } else {
        // Clear current box
        this.otpDigits[index] = '';
      }
    }
  }

  /**
   * Handle paste event to fill all OTP boxes
   * @param event - Clipboard event
   */
  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData
      ?.getData('text')
      .replace(/[^0-9]/g, '');

    if (pastedData && pastedData.length === 6) {
      // Fill all 6 boxes with pasted digits
      for (let i = 0; i < 6; i++) {
        this.otpDigits[i] = pastedData.charAt(i);
      }

      // Focus the last input
      const inputs = document.querySelectorAll('.otp-input');
      if (inputs.length === 6) {
        (inputs[5] as HTMLInputElement).focus();
      }
    }
  }

  /**
   * Check if all OTP digits are filled
   */
  isOtpComplete(): boolean {
    return this.otpDigits.every((digit) => digit !== '');
  }

  /**
   * Focus the first OTP input
   */
  private focusFirstInput(): void {
    const firstInput = document.querySelector('.otp-input') as HTMLInputElement;
    if (firstInput) {
      firstInput.focus();
    }
  }
}
