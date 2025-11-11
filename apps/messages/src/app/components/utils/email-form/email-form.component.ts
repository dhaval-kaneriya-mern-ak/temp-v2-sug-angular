import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  SugUiButtonComponent,
  SugUiTooltipComponent,
  SugUiMultiSelectDropdownComponent,
  ISelectOption,
} from '@lumaverse/sug-ui';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { ISignUpItem } from '@services/interfaces/messages-interface/compose.interface';

@Component({
  selector: 'sug-email-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SugUiButtonComponent,
    SugUiTooltipComponent,
    ButtonModule,
    SugUiMultiSelectDropdownComponent,
    ChipModule,
  ],
  templateUrl: './email-form.component.html',
  styleUrls: ['../../compose/compose_email/compose-email.scss'],
})
export class EmailFormComponent implements OnInit, OnChanges {
  @Input() emailForm!: FormGroup;
  @Input() formType: 'inviteToSignUp' | 'emailParticipants' = 'inviteToSignUp';
  @Input() title = 'Invite People to Sign Up';

  // Data inputs - replacing service dependencies
  @Input() selectedSignups: ISignUpItem[] = [];
  @Input() selectedTabGroups: ISelectOption[] = [];
  @Input() isSignUpIndexPageSelected = false;
  @Input() selectedGroups: ISelectOption[] = [];
  @Input() recipientCount = 0;
  @Input() selectedDateSlots: Array<{
    slotitemid: number;
    starttime: string;
    item: string;
    location: string;
    qtytaken: number;
    qtyremaining: number;
    signedupmembers: string;
  }> = [];
  @Input() subAdminsData: ISelectOption[] = [];

  @Output() openSignUpsDialog = new EventEmitter<void>();
  @Output() openPeopleDialog = new EventEmitter<void>();
  @Output() openSelectFileDialog = new EventEmitter<void>();
  @Output() openHelpDialog = new EventEmitter<void>();
  @Output() previewAndSend = new EventEmitter<void>();
  @Output() saveDraft = new EventEmitter<void>();
  @Output() showRecipientDetails = new EventEmitter<void>();
  @Output() editSelectedSlots = new EventEmitter<void>();
  @Output() removeSignupItem = new EventEmitter<number>();
  @Output() removeTabGroupItem = new EventEmitter<number>();
  @Output() removeSignUpIndexPageItem = new EventEmitter<void>();

  get hasSignupSelection(): boolean {
    return (
      this.selectedSignups.length > 0 ||
      this.selectedTabGroups.length > 0 ||
      this.isSignUpIndexPageSelected
    );
  }

  get hasPeopleSelection(): boolean {
    return this.selectedGroups.length > 0;
  }

  ngOnInit(): void {
    // Initialize component - form is passed from parent
    if (!this.emailForm) {
      console.warn('Email form not provided to email-form component');
    }

    // Set initial disabled state based on signup selection
    this.updateFormControlsState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Watch for changes in signup-related inputs and update form state
    if (
      changes['selectedSignups'] ||
      changes['selectedTabGroups'] ||
      changes['isSignUpIndexPageSelected']
    ) {
      this.updateFormControlsState();
    }
  }

  private updateFormControlsState(): void {
    if (this.hasSignupSelection) {
      // Enable all form controls when signup is selected
      this.emailForm.get('fromName')?.enable();
      this.emailForm.get('replyTo')?.enable();
      this.emailForm.get('subject')?.enable();
      this.emailForm.get('message')?.enable();
    } else {
      // Disable all form controls when no signup is selected
      this.emailForm.get('fromName')?.disable();
      this.emailForm.get('replyTo')?.disable();
      this.emailForm.get('subject')?.disable();
      this.emailForm.get('message')?.disable();
    }
  }

  onOpenSignUpsDialog(): void {
    this.openSignUpsDialog.emit();
  }

  onOpenPeopleDialog(): void {
    this.openPeopleDialog.emit();
  }

  onOpenSelectFileDialog(): void {
    this.openSelectFileDialog.emit();
  }

  onOpenHelpDialog(): void {
    this.openHelpDialog.emit();
  }

  onPreviewAndSend(): void {
    if (this.emailForm.valid) {
      this.previewAndSend.emit();
    }
  }

  onSaveDraft(): void {
    this.saveDraft.emit();
  }

  onShowRecipientDetails(): void {
    this.showRecipientDetails.emit();
  }

  onEditSelectedSlots(): void {
    this.editSelectedSlots.emit();
  }

  getSignupTitle(item: ISignUpItem): string {
    if (typeof item === 'string') {
      return item;
    }
    if (item.title) {
      return item.title;
    }
    if (item.fulltitle) {
      return item.fulltitle;
    }
    return 'Untitled Sign Up';
  }

  removeSignup(index: number): void {
    this.removeSignupItem.emit(index);
  }

  removeTabGroup(index: number): void {
    this.removeTabGroupItem.emit(index);
  }

  removeSignUpIndexPage(): void {
    this.removeSignUpIndexPageItem.emit();
  }
}
