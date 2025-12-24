import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  inject,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  SugUiButtonComponent,
  SugUiTooltipComponent,
  SugUiMultiSelectDropdownComponent,
  ISelectOption,
} from '@lumaverse/sug-ui';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { ProgressBarModule } from 'primeng/progressbar';
import {
  IMemberInfoDto,
  IFileItem,
  ISelectPortalOption,
  ISignUpItem,
  ITabGroupItem,
  SignupOptionGroup,
} from '@services/interfaces/messages-interface/compose.interface';
import { NgxCaptchaModule } from 'ngx-captcha';
import { environment } from '@environments/environment';
import { ComposeEmailStateService } from '../services/compose-email-state.service';

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
    NgxCaptchaModule,
    ProgressBarModule,
  ],
  templateUrl: './email-form.component.html',
  styleUrls: ['../../compose/compose_email/compose-email.scss'],
})
export class EmailFormComponent implements OnInit, OnChanges {
  @Input() emailForm!: FormGroup;
  @Input() isBasicUser = true;
  @Input() formType: 'inviteToSignUp' | 'emailParticipants' = 'inviteToSignUp';
  @Input() title = 'Invite People to Sign Up';
  @Input() readonly siteKey: string = environment.siteKey;
  // Data inputs - replacing service dependencies
  @Input() selectedSignups: ISignUpItem[] = [];
  @Input() selectedTabGroups: ITabGroupItem[] = [];
  @Input() selectedPortalPages: ISelectPortalOption[] = [];
  @Input() isSignUpIndexPageSelected = false;
  @Input() showAttachments = false;
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
  @Input() selectedMemberGroups: IMemberInfoDto[] = [];
  @Input() selectedAttachments: IFileItem[] = [];
  @Input() signUpOptions: (ISelectOption | SignupOptionGroup)[] = [];
  @Input() showInlineSignupDropdown = false;

  @Output() selectedSignupsChange = new EventEmitter<ISignUpItem[]>();
  @Output() openSignUpsDialog = new EventEmitter<void>();
  @Output() openPeopleDialog = new EventEmitter<void>();
  @Output() openSelectFileDialog = new EventEmitter<void>();
  @Output() openHelpDialog = new EventEmitter<void>();
  @Output() previewAndSend = new EventEmitter<void>();
  @Output() saveDraft = new EventEmitter<void>();
  @Output() showRecipientDetails = new EventEmitter<void>();
  @Output() editSelectedSlots = new EventEmitter<void>();
  @Output() editSelectedMemberGroups = new EventEmitter<void>();
  @Output() removeSignupItem = new EventEmitter<number>();
  @Output() removeTabGroupItem = new EventEmitter<number>();
  @Output() removePortalPageItem = new EventEmitter<number>();
  @Output() removeSignUpIndexPageItem = new EventEmitter<void>();
  @Output() attachmentValidationError = new EventEmitter<string>();
  @Output() downloadFileEvent = new EventEmitter<IFileItem>();
  @Output() removeGroupItem = new EventEmitter<number>();

  private stateService = inject(ComposeEmailStateService);

  // Attachment properties
  private readonly MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB
  private readonly ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];

  totalAttachmentSize = 0;

  attachmentUploadProgress: Map<string | number, number> = new Map();
  attachmentUploadError: Map<string | number, string> = new Map();

  dropdownControl = new FormControl<string[]>([]);

  get hasSignupSelection(): boolean {
    return (
      this.selectedSignups.length > 0 ||
      this.selectedTabGroups.length > 0 ||
      this.isSignUpIndexPageSelected ||
      this.selectedPortalPages.length > 0
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

    if (this.emailForm.invalid) {
      console.log('some fields are invalid');
    }

    // Set initial disabled state based on signup selection
    this.updateFormControlsState();

    // Initialize form with current input values
    this.syncFormWithInputs();

    this.logInvalidControls(this.emailForm);
  }

  private logInvalidControls(form: FormGroup) {
    const invalid: any = {};
    Object.keys(form.controls).forEach((key) => {
      const control = form.get(key);
      if (control && control.invalid) {
        invalid[key] = control.errors;
      }
    });
    console.log('Invalid Controls:', invalid);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Watch for changes in signup-related inputs and update form state
    if (
      changes['selectedSignups'] ||
      changes['selectedTabGroups'] ||
      changes['selectedPortalPages'] ||
      changes['isSignUpIndexPageSelected'] ||
      changes['showInlineSignupDropdown']
    ) {
      this.updateFormControlsState();
    }

    // Sync form controls with input property changes
    if (
      (changes['selectedSignups'] || changes['showInlineSignupDropdown']) &&
      this.emailForm
    ) {
      if (this.showInlineSignupDropdown) {
        // Map objects to IDs for the dropdown
        const selectedIds = this.selectedSignups.map((s) =>
          s.signupid.toString()
        );
        this.dropdownControl.setValue(selectedIds, { emitEvent: false });

        //  Update the Main Form with OBJECTS (so compose-email.ts doesn't crash)
        this.emailForm.patchValue(
          { selectedSignups: this.selectedSignups },
          { emitEvent: false }
        );
      } else {
        // Standard flow uses objects
        this.emailForm.patchValue({ selectedSignups: this.selectedSignups });
      }
    }

    if (changes['selectedGroups'] && this.emailForm) {
      this.emailForm.patchValue({ toPeople: this.selectedGroups });
    }

    if (changes['selectedDateSlots'] && this.emailForm) {
      // Update toPeople with selected date slots if applicable
      if (this.selectedDateSlots.length > 0) {
        this.emailForm.patchValue({ toPeople: this.selectedDateSlots });
      }
    }

    if (changes['selectedMemberGroups'] && this.emailForm) {
      // Update toPeople with selected member groups if applicable
      if (this.selectedMemberGroups.length > 0) {
        this.emailForm.patchValue({ toPeople: this.selectedMemberGroups });
      }
    }

    if (changes['selectedPortalPages'] && this.emailForm) {
      this.emailForm.patchValue({
        selectedPortalPages: this.selectedPortalPages,
      });
    }

    if (changes['selectedTabGroups'] && this.emailForm) {
      this.emailForm.patchValue({
        selectedTabGroups: this.selectedTabGroups,
      });
    }

    // Handle attachment changes
    if (
      changes['selectedAttachments'] &&
      !changes['selectedAttachments'].firstChange
    ) {
      const currentAttachments =
        changes['selectedAttachments'].currentValue || [];
      const previousAttachments =
        changes['selectedAttachments'].previousValue || [];

      // If attachments were completely cleared
      if (currentAttachments.length === 0 && previousAttachments.length > 0) {
        this.totalAttachmentSize = 0;
        return;
      }

      // Update total size based on current attachments
      this.totalAttachmentSize =
        this.stateService.calculateTotalSize(currentAttachments);
    }
  }

  private syncFormWithInputs(): void {
    if (!this.emailForm) return;

    // Sync form controls with current input values
    const updateData: { [key: string]: unknown } = {};

    if (this.selectedSignups) {
      updateData['selectedSignups'] = this.selectedSignups;
    }

    if (this.selectedGroups) {
      updateData['toPeople'] = this.selectedGroups;
    }

    if (this.selectedDateSlots && this.selectedDateSlots.length > 0) {
      updateData['toPeople'] = this.selectedDateSlots;
    }

    if (this.selectedPortalPages) {
      updateData['selectedPortalPages'] = this.selectedPortalPages;
    }

    if (this.selectedMemberGroups && this.selectedMemberGroups.length > 0) {
      updateData['toPeople'] = this.selectedMemberGroups;
    }

    // Update form with new values
    this.emailForm.patchValue(updateData);
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

  onEditSelectedMemberGroups(): void {
    this.editSelectedMemberGroups.emit();
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

  removePortalPage(index: number): void {
    this.removePortalPageItem.emit(index);
  }

  handleReset(): void {
    this.emailForm.get('token')?.reset();
  }

  handleExpire(): void {
    this.emailForm.get('token')?.setValue(null);
  }

  handleSuccess(token: string): void {
    this.emailForm.get('token')?.setValue(token);
  }

  removeAttachment(index: number): void {
    if (index < 0 || index >= this.selectedAttachments.length) {
      return;
    }

    const attachment = this.selectedAttachments[index];
    const fileSizeBytes = (attachment.filesizekb || 0) * 1024;

    // Update total attachment size
    this.totalAttachmentSize = Math.max(
      0,
      this.totalAttachmentSize - fileSizeBytes
    );

    // Notify parent component to remove attachment via state service
    const updatedAttachments = this.selectedAttachments.filter(
      (_, i) => i !== index
    );
    this.stateService.setSelectedAttachment(updatedAttachments);
  }

  getFormattedFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  getRemainingStorage(): { used: number; remaining: number } {
    return {
      used: this.totalAttachmentSize,
      remaining: this.MAX_FILE_SIZE - this.totalAttachmentSize,
    };
  }

  getTotalAttachmentSizeFormatted(): string {
    return this.getFormattedFileSize(this.totalAttachmentSize);
  }

  getMaxAttachmentSizeFormatted(): string {
    return this.getFormattedFileSize(this.MAX_FILE_SIZE);
  }

  canAddMoreAttachments(): boolean {
    return this.totalAttachmentSize < this.MAX_FILE_SIZE;
  }

  isAllowedFileType(mimeType: string): boolean {
    return this.ALLOWED_TYPES.includes(mimeType);
  }

  getFileTypeIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const iconMap: { [key: string]: string } = {
      pdf: 'fa-file-pdf',
      doc: 'fa-file-word',
      docx: 'fa-file-word',
      xls: 'fa-file-excel',
      xlsx: 'fa-file-excel',
      txt: 'fa-file',
      csv: 'fa-file',
      jpg: 'fa-image',
      jpeg: 'fa-image',
      png: 'fa-image',
      gif: 'fa-image',
    };
    return iconMap[ext] || 'fa-file';
  }

  downloadFile(file: IFileItem): void {
    this.downloadFileEvent.emit(file);
  }

  removeGroup(index: number): void {
    this.removeGroupItem.emit(index);
  }

  onSignUpSelectionChange(event: { value: string[] }): void {
    // Get the current selection from the event
    let selectedIds = event.value || [];

    // Enforce single selection logic:
    // If we are in "inline dropdown" mode and have a selection, keep only the last selected item.
    if (this.showInlineSignupDropdown && selectedIds.length > 1) {
      selectedIds = [selectedIds[selectedIds.length - 1]];

      // Use setTimeout to force the UI to update.
      // Without this, the component's internal state might overwrite our change in the same tick.
      setTimeout(() => {
        this.dropdownControl.setValue(selectedIds, { emitEvent: false });
      });
    }

    const selectedSignups: ISignUpItem[] = [];

    // Type Safety: Iterate through options to find the selected objects without unsafe casting
    this.signUpOptions.forEach((groupOrOption) => {
      // Check if it is a group (has 'items' array)
      if ('items' in groupOrOption && Array.isArray(groupOrOption.items)) {
        const group = groupOrOption as SignupOptionGroup;

        group.items.forEach((item) => {
          if (selectedIds.includes(item.value)) {
            selectedSignups.push(item.signupData);
          }
        });
      } else {
        // Handle direct ISelectOption items (flat list)
        // Cast to any to check for signupData property which might exist on the option
        const item = groupOrOption as any;
        if (selectedIds.includes(item.value) && item.signupData) {
          selectedSignups.push(item.signupData);
        }
      }
    });

    // Update the Main Form with OBJECTS
    this.emailForm.get('selectedSignups')?.setValue(selectedSignups);

    // Emit the selected signup object(s) to the parent component
    this.selectedSignupsChange.emit(selectedSignups);
  }
}
