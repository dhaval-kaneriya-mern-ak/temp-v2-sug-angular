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
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
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
} from '@services/interfaces/messages-interface/compose.interface';
import { NgxCaptchaModule } from 'ngx-captcha';
import { environment } from '@environments/environment';

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
  @Input() selectedTabGroups: ISelectOption[] = [];
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

  attachmentUploadProgress: Map<string | number, number> = new Map();
  attachmentUploadError: Map<string | number, string> = new Map();
  totalAttachmentSize = 0;

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

    // Set initial disabled state based on signup selection
    this.updateFormControlsState();

    // Initialize form with current input values
    this.syncFormWithInputs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Watch for changes in signup-related inputs and update form state
    if (
      changes['selectedSignups'] ||
      changes['selectedTabGroups'] ||
      changes['selectedPortalPages'] ||
      changes['isSignUpIndexPageSelected']
    ) {
      this.updateFormControlsState();
    }

    // Sync form controls with input property changes
    if (changes['selectedSignups'] && this.emailForm) {
      this.emailForm.patchValue({ selectedSignups: this.selectedSignups });
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

    // Handle attachment changes - simulate upload progress
    if (changes['selectedAttachments']) {
      const currentAttachments =
        changes['selectedAttachments'].currentValue || [];
      const previousAttachments =
        changes['selectedAttachments'].previousValue || [];

      // Check if new files were added
      if (currentAttachments.length > previousAttachments.length) {
        const newAttachments = currentAttachments.slice(
          previousAttachments.length
        );

        newAttachments.forEach((file: IFileItem) => {
          const fileId = file.id || file.filename || '';
          const fileSizeBytes = (file.filesizekb || 0) * 1024;

          // Check if file is already in attachments (duplicate)
          const isDuplicate = previousAttachments.some(
            (prev: IFileItem) =>
              prev.id === file.id && prev.filename === file.filename
          );

          if (isDuplicate) {
            // Remove the duplicate file from attachments
            const fileIndex = this.selectedAttachments.findIndex(
              (f: IFileItem) => f.id === file.id && f.filename === file.filename
            );
            if (fileIndex > -1) {
              this.selectedAttachments.splice(fileIndex, 1);
              this.selectedAttachments = [...this.selectedAttachments];
            }
            return;
          }

          // Check if adding this file would exceed 7MB limit
          if (this.totalAttachmentSize + fileSizeBytes > this.MAX_FILE_SIZE) {
            // Remove the file from attachments
            const fileIndex = this.selectedAttachments.findIndex(
              (f: IFileItem) => f.id === file.id
            );
            if (fileIndex > -1) {
              this.selectedAttachments.splice(fileIndex, 1);
              this.selectedAttachments = [...this.selectedAttachments];
            }
            return;
          }

          if (fileId) {
            // Start upload progress simulation
            this.simulateFileUpload(fileId);
            // Add to total size
            this.totalAttachmentSize += fileSizeBytes;
          }
        });
      }
      // Check if files were removed
      else if (currentAttachments.length < previousAttachments.length) {
        const removedFile = previousAttachments.find(
          (prev: IFileItem) =>
            !currentAttachments.find((curr: IFileItem) => curr.id === prev.id)
        );
        if (removedFile) {
          this.totalAttachmentSize -= (removedFile.filesizekb || 0) * 1024;
          this.attachmentUploadProgress.delete(
            removedFile.id || removedFile.filename || 0
          );
          this.attachmentUploadError.delete(
            removedFile.id || removedFile.filename || 0
          );
        }
      }
    }
  }

  /**
   * Simulate file upload progress
   */
  private simulateFileUpload(fileId: string | number): void {
    const progressIntervals: number[] = [10, 25, 40, 60, 75, 85, 95];
    let progressIndex = 0;

    const uploadInterval = setInterval(() => {
      if (progressIndex < progressIntervals.length) {
        this.attachmentUploadProgress.set(
          fileId,
          progressIntervals[progressIndex]
        );
        progressIndex++;
      } else {
        // Complete the upload
        this.attachmentUploadProgress.set(fileId, 100);
        clearInterval(uploadInterval);
      }
    }, 200); // Progress update every 200ms
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

    // Clean up progress and error maps
    const fileId = attachment.id || attachment.filename || index;
    this.attachmentUploadProgress.delete(fileId);
    this.attachmentUploadError.delete(fileId);

    // Remove from attachments array
    this.selectedAttachments.splice(index, 1);
    this.selectedAttachments = [...this.selectedAttachments];
  }

  clearAttachments(): void {
    this.selectedAttachments = [];
    this.attachmentUploadProgress.clear();
    this.attachmentUploadError.clear();
    this.totalAttachmentSize = 0;
  }

  getAttachmentProgress(fileId: string | number): number {
    return this.attachmentUploadProgress.get(fileId) || 0;
  }

  getAttachmentError(fileId: string | number): string | undefined {
    return this.attachmentUploadError.get(fileId);
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

  getStoragePercentage(): number {
    return (this.totalAttachmentSize / this.MAX_FILE_SIZE) * 100;
  }

  isAllowedFileType(mimeType: string): boolean {
    return this.ALLOWED_TYPES.includes(mimeType);
  }

  getFileTypeIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const iconMap: { [key: string]: string } = {
      pdf: 'pi-file-pdf',
      doc: 'pi-file-word',
      docx: 'pi-file-word',
      xls: 'pi-file-excel',
      xlsx: 'pi-file-excel',
      txt: 'pi-file',
      csv: 'pi-file',
      jpg: 'pi-image',
      jpeg: 'pi-image',
      png: 'pi-image',
      gif: 'pi-image',
    };
    return iconMap[ext] || 'pi-file';
  }

  updateAttachmentProgress(fileId: string | number, progress: number): void {
    this.attachmentUploadProgress.set(fileId, progress);
  }

  setAttachmentError(fileId: string | number, error: string): void {
    this.attachmentUploadError.set(fileId, error);
  }

  clearAttachmentError(fileId: string | number): void {
    this.attachmentUploadError.delete(fileId);
  }

  downloadFile(file: IFileItem): void {
    console.log(file);
  }
}
