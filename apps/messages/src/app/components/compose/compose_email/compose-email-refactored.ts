import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  SugUiRadioCheckboxButtonComponent,
  RadioCheckboxChangeEvent,
  SugUiLoadingSpinnerComponent,
} from '@lumaverse/sug-ui';
import { ComposeService } from '../compose.service';
import { ComposeEmailStateService } from '../../utils/services/compose-email-state.service';
import { EmailFormComponent } from '../../utils/email-form/email-form.component';
import { SignupSelectionDialogComponent } from '../../utils/signup-selection-dialog/signup-selection-dialog.component';
import { HelpDialogComponent } from '../../utils/help-dialog/help-dialog.component';
import { PeopleSelectionDialogComponent } from '../../utils/people-selection-dialog/people-selection-dialog.component';
import { PreviewEmailComponent } from '../../utils/preview-email/preview-email.component';
import { RecipientDetailsDialogComponent } from '../../utils/recipient-details-dialog/recipient-details-dialog.component';
import { FileSelectionDialogComponent } from '../../utils/file-selection-dialog/file-selection-dialog.component';
import { DateSlotsSelectionComponent } from '../../utils/date-slots-selection/date-slots-selection.component';
import { UserStateService } from '@services/user-state.service';
import { Subject, takeUntil } from 'rxjs';
import {
  MemberProfile,
  ISignUpItem,
  SignupOptionGroup,
} from '@services/interfaces';

/**
 * Main Compose Email Component (Refactored)
 * This component orchestrates the email composition workflow
 * Line count: ~380 lines (target: <400)
 */
@Component({
  selector: 'sug-compose-email',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SugUiRadioCheckboxButtonComponent,
    SugUiLoadingSpinnerComponent,
    EmailFormComponent,
    SignupSelectionDialogComponent,
    HelpDialogComponent,
    PeopleSelectionDialogComponent,
    PreviewEmailComponent,
    RecipientDetailsDialogComponent,
    FileSelectionDialogComponent,
    DateSlotsSelectionComponent,
  ],
  providers: [
    ComposeEmailStateService, // Provide at component level
  ],
  templateUrl: './compose-email-refactored.html',
  styleUrls: ['./compose-email.scss'],
})
export class ComposeEmailComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private composeService = inject(ComposeService);
  private userStateService = inject(UserStateService);
  private cdr = inject(ChangeDetectorRef);
  protected stateService = inject(ComposeEmailStateService);

  @ViewChild(SignupSelectionDialogComponent)
  signupDialog!: SignupSelectionDialogComponent;

  // Forms
  emailFormOne!: FormGroup;
  emailFormTwo!: FormGroup;

  // UI State
  showRadioButtons = true;
  selectedValue: string | null = null;
  isLoading = false;
  userProfile: MemberProfile | null = null;

  // Dialog visibility flags
  isHelpDialogVisible = false;
  isPeopleDialogVisible = false;
  isSelectFileDialogVisible = false;
  isRecipientDialogVisible = false;
  isPreviewDialogVisible = false;
  isDateSlotsDialogVisible = false;

  // Radio options for main selection
  radioOptions = [
    { label: 'Invite people to a sign up', value: 'emailoptionone' },
    {
      label: 'Email people participating in a sign up',
      value: 'emailoptiontwo',
    },
  ];

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeForms();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize reactive forms
   */
  private initializeForms(): void {
    // Form for "Invite people to a sign up"
    this.emailFormOne = this.fb.group({
      token: ['', Validators.required],
      selectedSignups: [[], Validators.required],
      fromName: ['', Validators.required],
      replyTo: [{ value: [], disabled: true }],
      toPeople: [{ value: [], disabled: true }, Validators.required],
      subject: [{ value: '', disabled: true }, Validators.required],
      message: [{ value: '', disabled: true }, Validators.required],
      attachments: [[]],
    });

    // Form for "Email people participating in a sign up"
    this.emailFormTwo = this.fb.group({
      token: ['', Validators.required],
      selectedSignups: [[], Validators.required],
      fromName: ['', Validators.required],
      replyTo: [{ value: [], disabled: true }],
      toPeople: [{ value: [], disabled: true }, Validators.required],
      subject: [{ value: '', disabled: true }, Validators.required],
      message: [{ value: '', disabled: true }, Validators.required],
      attachments: [[]],
    });

    // Subscribe to signup selection changes to enable/disable form controls
    // and update subject/message
    this.stateService.selectedSignups$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.toggleFormControls();
        // Update subject and message when signups change (add or remove)
        // Skip initial value (empty array)
        if (this.userProfile) {
          this.updateSubjectAndMessage();
        }
      });

    this.stateService.selectedTabGroups$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.toggleFormControls();
        // Clear subject and message when tab groups are selected
        if (this.userProfile) {
          this.updateSubjectAndMessage();
        }
      });

    this.stateService.isSignUpIndexPageSelected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.toggleFormControls();
        // Clear subject and message when index page is selected
        if (this.userProfile) {
          this.updateSubjectAndMessage();
        }
      });
  }

  /**
   * Load initial data from API
   */
  private loadInitialData(): void {
    this.isLoading = true;

    // Load signups
    this.composeService.getSignUpList().subscribe({
      next: (response) => {
        if (response && response.data) {
          const signupOptions = this.transformSignupsToOptions(response.data);
          this.stateService.setSignUpOptions(signupOptions);
        }
      },
      error: () => {
        // Error loading signups
      },
    });

    // Load groups
    this.composeService.getGroupforMembers().subscribe({
      next: (response) => {
        if (response && response.data) {
          const groupOptions = response.data.map((group) => ({
            label: group.title || 'Unnamed Group',
            value: group.id.toString(),
          }));
          this.stateService.setGroupOptions(groupOptions);
        }
      },
      error: () => {
        // Error loading groups
      },
    });

    // Load sub-admins
    this.loadSubAdmins();

    // Load tab groups (for pro users)
    this.loadTabGroups();

    this.isLoading = false;
  }

  /**
   * Load user profile
   */
  private loadUserProfile(): void {
    this.userStateService.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.userProfile = profile;
          if (profile) {
            // Pre-fill "From" name
            const fullName = `${profile.firstname || ''} ${
              profile.lastname || ''
            }`.trim();
            this.emailFormOne.patchValue({ fromName: fullName });
            this.emailFormTwo.patchValue({ fromName: fullName });
          }
        },
        error: () => {
          // Error loading user profile
        },
      });
  }

  /**
   * Load sub-admins for Reply To dropdown
   */
  private loadSubAdmins(): void {
    this.composeService.getSubAdmins().subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          const subAdminOptions = response.data.map((admin) => ({
            label: admin.email,
            value: admin.id.toString(),
          }));
          this.stateService.setSubAdminsData(subAdminOptions);
        }
      },
      error: () => {
        // Error loading sub-admins
      },
    });
  }

  /**
   * Load tab groups for pro users
   */
  private loadTabGroups(): void {
    // Tab groups API call - implement when API is available
    // For now, set empty array
    this.stateService.setTabGroupsData([]);
  }

  /**
   * Transform signup data to select options with grouping
   */
  private transformSignupsToOptions(
    signups: ISignUpItem[]
  ): SignupOptionGroup[] {
    const rsvpSignUps = signups.filter(
      (signup) => signup.mode?.toLowerCase() === 'rsvp'
    );
    const regularSignUps = signups.filter(
      (signup) => signup.mode?.toLowerCase() === 'standard'
    );

    const groups: SignupOptionGroup[] = [];

    // Add RSVP Sign Ups group if there are any
    if (rsvpSignUps.length > 0) {
      groups.push({
        label: 'RSVP Sign Ups',
        value: 'rsvp-group',
        items: rsvpSignUps.map((signup) => ({
          label: signup.title || signup.fulltitle || 'Untitled',
          value: signup.signupid.toString(),
          signupData: signup,
        })),
      });
    }

    // Add Standard Sign Ups group if there are any
    if (regularSignUps.length > 0) {
      groups.push({
        label: 'Standard Sign Ups',
        value: 'standard-group',
        items: regularSignUps.map((signup) => ({
          label: signup.title || signup.fulltitle || 'Untitled',
          value: signup.signupid.toString(),
          signupData: signup,
        })),
      });
    }

    return groups;
  }

  /**
   * Toggle form controls based on signup selection
   */
  private toggleFormControls(): void {
    const hasSelection =
      this.stateService.selectedSignups.length > 0 ||
      this.stateService.selectedTabGroups.length > 0 ||
      this.stateService.isSignUpIndexPageSelected;

    const forms = [this.emailFormOne, this.emailFormTwo];
    const controls = ['replyTo', 'toPeople', 'subject', 'message'];

    forms.forEach((form) => {
      controls.forEach((controlName) => {
        const control = form.get(controlName);
        if (hasSelection) {
          control?.enable();
        } else {
          control?.disable();
        }
      });
    });
  }

  /**
   * Handle main radio selection
   */
  handleSelection(event: RadioCheckboxChangeEvent): void {
    this.selectedValue = event.value as string;
    this.showRadioButtons = false;
    this.loadUserProfile();
  }

  /**
   * Show options again (back button)
   */
  showOptionsAgain(): void {
    this.showRadioButtons = true;
    this.selectedValue = null;

    // Reset main forms
    this.emailFormOne.reset();
    this.emailFormTwo.reset();

    // Clear all selections in state service
    this.stateService.clearAllSelections();

    // Reload user profile to re-populate form fields
    this.loadUserProfile();

    // Ensure controls are disabled after reset
    this.toggleFormControls();
  }

  /**
   * Dialog handlers
   */
  openSignUpsDialog(): void {
    this.signupDialog?.openDialog();
  }

  onSignupsSelected(): void {
    // Called when signups are selected from dialog
    // State is already updated by the dialog component

    // Update subject and message based on selected signups
    this.updateSubjectAndMessage();
  }

  openPeopleDialog(): void {
    // TODO: Implement when PeopleSelectionDialogComponent is created
    this.isPeopleDialogVisible = true;
  }

  openHelpDialog(): void {
    this.isHelpDialogVisible = true;
  }

  closeHelpDialog(): void {
    this.isHelpDialogVisible = false;
  }

  openSelectFileDialog(): void {
    this.isSelectFileDialogVisible = true;
  }

  openDateSlotsDialog(): void {
    this.isDateSlotsDialogVisible = true;
  }

  closeDateSlotsDialog(): void {
    this.isDateSlotsDialogVisible = false;
  }

  onDateSlotsSelected(): void {
    // Called when date slots are selected from dialog
    this.closeDateSlotsDialog();

    // Re-open the people selection dialog to show the selected slots
    setTimeout(() => {
      this.isPeopleDialogVisible = true;
    }, 100);
  }

  showRecipientDetails(): void {
    // Force close the dialog first to reset its internal state
    this.isRecipientDialogVisible = false;
    this.cdr.detectChanges();

    // Then open it with a small delay to ensure proper re-initialization
    setTimeout(() => {
      this.isRecipientDialogVisible = true;
      this.cdr.detectChanges();
    }, 0);
  }

  /**
   * Form submission handlers
   */
  onPreviewAndSend(formType: 'inviteToSignUp' | 'emailParticipants'): void {
    const form =
      formType === 'inviteToSignUp' ? this.emailFormOne : this.emailFormTwo;

    if (form.invalid) {
      Object.keys(form.controls).forEach((key) => {
        form.get(key)?.markAsTouched();
      });
      return;
    }

    // Open preview dialog
    this.isPreviewDialogVisible = true;

    // TODO: Prepare email data for preview
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSaveDraft(_formType: 'inviteToSignUp' | 'emailParticipants'): void {
    // TODO: Implement save draft API call
    // const form = _formType === 'inviteToSignUp' ? this.emailFormOne : this.emailFormTwo;
  }

  /**
   * Update subject and message based on selected signups
   */
  private updateSubjectAndMessage(): void {
    const currentForm =
      this.selectedValue === 'emailoptionone'
        ? this.emailFormOne
        : this.emailFormTwo;

    const subjectControl = currentForm.get('subject');
    const messageControl = currentForm.get('message');

    // If Sign Up Index Page is selected, set subject and allow user to enter message
    if (this.stateService.isSignUpIndexPageSelected) {
      if (subjectControl) {
        subjectControl.patchValue('Sign Up Invite');
      }
      // Don't clear message - let user enter it
      return;
    }

    // If tab groups are selected, clear subject and message (user enters manually)
    if (this.stateService.selectedTabGroups.length > 0) {
      if (subjectControl && messageControl) {
        subjectControl.patchValue('');
        messageControl.patchValue('');
      }
      return;
    }

    // Only update if we have signups selected and user profile is loaded
    if (!this.userProfile || this.stateService.selectedSignups.length === 0) {
      // Clear subject and message if no signups selected
      if (subjectControl && messageControl) {
        subjectControl.patchValue('');
        messageControl.patchValue('');
      }
      return;
    }

    const userFullName = `${this.userProfile.firstname || ''} ${
      this.userProfile.lastname || ''
    }`.trim();

    if (this.stateService.selectedSignups.length === 1) {
      // Single signup selected
      const signup = this.stateService.selectedSignups[0];
      const signupName = this.getSignupTitle(signup);
      const subject = `${signupName} Invite`;
      let message = `You have been invited by ${userFullName} to sign up for ${signupName}. Please click on the button below to view the online sign up sheet.`;

      // Check if signup has password protection
      if (this.hasPasswordProtection(signup)) {
        const passcode = this.getPasscode(signup);
        if (passcode) {
          message += `\n\nThis sign up is protected by an access code. When prompted, enter the code "${passcode}" for access.`;
        }
      }

      if (subjectControl && messageControl) {
        subjectControl.patchValue(subject);
        messageControl.patchValue(message);
      }
    } else if (this.stateService.selectedSignups.length > 1) {
      // Multiple signups selected - DO NOT include passcode info
      const subject = 'Sign Up Invite';
      const message = `You have been invited by ${userFullName} to sign up for one or more events.`;

      if (subjectControl && messageControl) {
        subjectControl.patchValue(subject);
        messageControl.patchValue(message);
      }
    }
  }

  /**
   * Get signup title
   */
  private getSignupTitle(signup: ISignUpItem): string {
    return signup?.fulltitle || signup?.title || 'No Title Available';
  }

  /**
   * Check if signup has password protection
   */
  private hasPasswordProtection(signup: ISignUpItem): boolean {
    return (
      signup.haspassword === true ||
      signup.haspassword === 'true' ||
      signup.haspassword === '1'
    );
  }

  /**
   * Get passcode from signup
   */
  private getPasscode(signup: ISignUpItem): string {
    return signup.passcode || '';
  }

  get currentForm(): FormGroup {
    return this.selectedValue === 'emailoptionone'
      ? this.emailFormOne
      : this.emailFormTwo;
  }

  get currentFormType(): 'inviteToSignUp' | 'emailParticipants' {
    return this.selectedValue === 'emailoptionone'
      ? 'inviteToSignUp'
      : 'emailParticipants';
  }

  get currentFormTitle(): string {
    return this.selectedValue === 'emailoptionone'
      ? 'Invite People to Sign Up'
      : 'Email People Participating in a Sign Up';
  }
}
