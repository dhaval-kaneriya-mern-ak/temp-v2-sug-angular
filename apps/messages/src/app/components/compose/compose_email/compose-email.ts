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
  IMessagePreviewRequest,
  ICreateMessageRequest,
  MessageStatus,
  SentTo,
  SendToType,
  ISelectPortalOption,
  IFileItem,
} from '@services/interfaces';
import { ToastrService } from 'ngx-toastr';
import { MyGroupSelection } from '../../utils/my-group-selection/my-group-selection';

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
    MyGroupSelection,
  ],
  providers: [
    ComposeEmailStateService, // Provide at component level
  ],
  templateUrl: './compose-email.html',
  styleUrls: ['./compose-email.scss'],
})
export class ComposeEmailComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private composeService = inject(ComposeService);
  protected userStateService = inject(UserStateService);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService);
  protected stateService = inject(ComposeEmailStateService);

  @ViewChild(SignupSelectionDialogComponent)
  signupDialog!: SignupSelectionDialogComponent;
  messageStatus = MessageStatus;
  // Forms
  emailFormOne!: FormGroup;
  emailFormTwo!: FormGroup;
  selectedRadioOption: {
    selectedValue: string;
    includeNonGroupMembers: boolean;
    fromCustomGroup?: boolean;
    recipients: any[];
  } = {
    selectedValue: '',
    includeNonGroupMembers: false,
    recipients: [],
  };

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
  isMyGroupsDialogVisible = false;

  // Radio options for main selection
  radioOptions = [
    { label: 'Invite people to a sign up', value: 'emailoptionone' },
    {
      label: 'Email people participating in a sign up',
      value: 'emailoptiontwo',
    },
  ];
  emailHtmlPreview = '';
  availableThemes: Array<number> = [1];
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserProfile();
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
      selectedSignups: [[]],
      selectedTabGroups: [[]],
      selectedPortalPages: [[]],
      isSignUpIndexPageSelected: [false],
      fromName: ['', Validators.required],
      replyTo: [{ value: [], disabled: true }],
      toPeople: [{ value: [], disabled: true }],
      subject: [{ value: '', disabled: true }, Validators.required],
      message: [{ value: '', disabled: true }, Validators.required],
      attachments: [[]],
      themeid: [1],
    });

    // Form for "Email people participating in a sign up"
    this.emailFormTwo = this.fb.group({
      token: ['', Validators.required],
      selectedSignups: [[]],
      selectedTabGroups: [[]],
      selectedPortalPages: [[]],
      isSignUpIndexPageSelected: [false],
      fromName: ['', Validators.required],
      replyTo: [{ value: [], disabled: true }],
      toPeople: [{ value: [], disabled: true }],
      subject: [{ value: '', disabled: true }, Validators.required],
      message: [{ value: '', disabled: true }, Validators.required],
      attachments: [[]],
      themeid: [1],
    });

    // Subscribe to state changes and update forms accordingly
    this.setupStateSubscriptions();
  }

  /**
   * Setup state subscriptions with centralized form update logic
   */
  private setupStateSubscriptions(): void {
    // Helper function to update both forms with given data
    const updateBothForms = (data: Record<string, unknown>) => {
      this.emailFormOne.patchValue(data);
      this.emailFormTwo.patchValue(data);
    };

    // Helper function to handle state changes that affect form controls and subject/message
    const handleFormStateChange = (data: Record<string, unknown>) => {
      this.toggleFormControls();
      updateBothForms(data);
      if (this.userProfile) {
        this.updateSubjectAndMessage();
      }
    };

    // Signup selections subscription
    this.stateService.selectedSignups$
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedSignups) => {
        handleFormStateChange({ selectedSignups });
      });

    // Portal pages subscription
    this.stateService.selectedPortalPages$
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedPortalPages) => {
        handleFormStateChange({ selectedPortalPages });
      });

    // Tab groups subscription
    this.stateService.selectedTabGroups$
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedTabGroups) => {
        handleFormStateChange({ selectedTabGroups });
      });

    // Index page selection subscription
    this.stateService.isSignUpIndexPageSelected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isSelected) => {
        handleFormStateChange({ isSignUpIndexPageSelected: isSelected });
      });

    // Selected groups subscription
    this.stateService.selectedGroups$
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedGroups) => {
        updateBothForms({ toPeople: selectedGroups });
      });

    // Selected date slots subscription
    this.stateService.selectedDateSlots$
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedDateSlots) => {
        if (selectedDateSlots?.length > 0) {
          updateBothForms({ toPeople: selectedDateSlots });
        }
      });
    // Selected member group subscription
    this.stateService.selectedMemberGroups$
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedMemberGroups) => {
        if (selectedMemberGroups?.length > 0) {
          updateBothForms({ toPeople: selectedMemberGroups });
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
        if (response?.data) {
          const signupOptions = this.transformSignupsToOptions(response.data);
          this.stateService.setSignUpOptions(signupOptions);
        }
      },
    });

    //Load portal signup info
    if (this.userProfile?.features?.portalpages) {
      this.composeService.getPortalSignup().subscribe({
        next: (response) => {
          if (response?.data) {
            this.stateService.setPortalSignUpOptions(response.data);
          }
        },
      });
    }

    this.composeService
      .getMemberIndexPage(this.userProfile?.id?.toString() || '')
      .subscribe({
        next: (response) => {
          if (response?.data && response?.data?.url) {
            this.stateService.setMemberIndexPageUrl(response.data.url);
          }
        },
      });

    // Load groups
    this.composeService.getGroupforMembers().subscribe({
      next: (response) => {
        if (response?.data) {
          const groupOptions = response.data.map((group) => ({
            label: group.title || 'Unnamed Group',
            value: group.id.toString(),
          }));
          this.stateService.setGroupOptions(groupOptions);
        }
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
      });
  }

  /**
   * Load sub-admins for Reply To dropdown
   */
  private loadSubAdmins(): void {
    this.composeService.getSubAdmins().subscribe({
      next: (response) => {
        if (response?.success && response.data) {
          const subAdminOptions = response.data.map((admin) => ({
            label: admin.email,
            value: admin.id.toString(),
          }));
          this.stateService.setSubAdminsData(subAdminOptions);
        }
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
      this.stateService.selectedPortalPages.length > 0 ||
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
    this.emailFormOne.reset({
      themeid: 1,
    });
    this.emailFormTwo.reset({
      themeid: 1,
    });

    // Clear all selections in state service
    this.stateService.clearAllSelections();

    // Reload user profile to re-populate form fields
    this.loadUserProfile();

    // Ensure controls are disabled after reset
    this.toggleFormControls();
  }

  getIsBasicUser(): boolean {
    return (
      this.userProfile?.ispro === false && this.userProfile?.istrial === false
    );
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
    // Reset dialog state to ensure clean reopening
    this.isRecipientDialogVisible = false;

    // Reopen after Angular completes current change detection cycle
    setTimeout(() => {
      this.isRecipientDialogVisible = true;
    });
  }

  openMyGroupDialog(): void {
    this.isMyGroupsDialogVisible = false;
    setTimeout(() => {
      this.isMyGroupsDialogVisible = true;
    });
  }

  closeMyGroupDialog(): void {
    this.isMyGroupsDialogVisible = false;
  }

  onMyGroupsSelected(): void {
    // Called when date slots are selected from dialog
    this.closeMyGroupDialog();

    // Re-open the people selection dialog to show the selected slots
    setTimeout(() => {
      this.isPeopleDialogVisible = true;
    }, 100);
  }

  /**
   * Opens the preview dialog with proper state reset to avoid dialog stuck issues
   */
  private openPreviewDialog(form: FormGroup): void {
    this.isLoading = true;
    const payload: IMessagePreviewRequest = {
      fromname: form.value.fromName,
      replyto: this.stateService.subAdminsData
        .filter((su) => form.value.replyTo.includes(String(su.value)))
        .map((su) => su.label),
      subject: form.value.subject,
      message: form.value.message,
      emailType: this.selectedValue === 'emailoptionone' ? '4' : '1',
      themeid: form.value.themeid,
    };

    // Only add portals if there are any selected
    if (form.value.selectedSignups && form.value.selectedSignups.length >= 1) {
      payload.signups = form.value.selectedSignups.map((su: any) => ({
        id: su.signupid,
        title: su.title,
        themeid: su.themeid,
      }));
    }

    //add attachments
    if (this.stateService.selectedAttachment.length > 0) {
      payload.attachmentids = this.stateService.selectedAttachment.map(
        (file) => file.id
      );
    }

    // Only add portals if there are any selected
    if (
      form.value.selectedPortalPages &&
      form.value.selectedPortalPages.length >= 1
    ) {
      payload.portals = form.value.selectedPortalPages.map((pp: any) => ({
        id: pp.id,
        title: pp.title,
        urlkey: pp.urlkey,
      }));
    }
    if (form.value.isSignUpIndexPageSelected) {
      payload.signUpType = 'acctindex';
      // const signupsFromOptions = (this.stateService.signUpOptions || [])
      //   .flatMap((g) => g.items ?? [])
      //   .map((item) => {
      //     const signupData = (item as any).signupData as
      //       | ISignUpItem
      //       | undefined;
      //     return {
      //       id: signupData?.signupid ?? Number(item.value),
      //       title: signupData?.title ?? item.label,
      //       themeid: signupData?.themeid ?? 1,
      //     };
      //   });
      // payload.signups = signupsFromOptions;
      // this.availableThemes = [
      //   1,
      //   ...(signupsFromOptions || []).map((su) => su.themeid),
      // ];
    }
    if (form.value.toPeople.length > 0) {
      payload.sendTo = form.value.toPeople.map((person: any) => ({
        id: Number(person.value || 1),
        displayName: person.label,
        isChecked: true,
      }));
    }
    // Load signups
    this.composeService.messagePreview(payload).subscribe({
      next: (response) => {
        if (
          response?.success &&
          response.data &&
          response.data?.textpreview?.length > 0
        ) {
          this.emailHtmlPreview = response.data.htmlpreview;
          this.currentForm.get('token')?.removeValidators(Validators.required);
          this.currentForm.get('token')?.updateValueAndValidity();
          setTimeout(() => {
            this.isLoading = false;
            this.isPreviewDialogVisible = true;
            this.cdr.detectChanges();
          });
        }
      },
      error: () => {
        this.isLoading = false;
        this.isPreviewDialogVisible = false;
      },
    });
  }

  /**
   * Form submission handlers
   */
  onPreviewAndSend(formType: 'inviteToSignUp' | 'emailParticipants'): void {
    const form =
      formType === 'inviteToSignUp' ? this.emailFormOne : this.emailFormTwo;

    // Perform custom validation based on people selection and Show error messages to user
    const customValidationResult = this.validateFormBasedOnSelection();
    if (!customValidationResult.isValid) {
      customValidationResult.errors.forEach((error) => {
        this.toastr.error(error, 'Validation Error');
      });
      return;
    }
    this.availableThemes = [
      1,
      ...((form.value.selectedSignups || []) as ISignUpItem[]).map(
        (su: ISignUpItem) => su.themeid
      ),
    ];
    if (form.invalid) {
      // Mark all controls as touched to show validation errors
      Object.keys(form.controls).forEach((key) => {
        form.get(key)?.markAsTouched();
      });
      return;
    }
    this.openPreviewDialog(form);
  }

  scheduleEmail(event: string): void {
    this.onSaveDraft(this.messageStatus.SCHEDULED, event);
  }

  setSelectedRadio(event: {
    selectedValue: string;
    includeNonGroupMembers: boolean;
    recipients: any[];
  }): void {
    this.selectedRadioOption = event;
  }

  onSaveDraft(status: MessageStatus, date?: string): void {
    this.isLoading = true;
    const groups = this.stateService.selectedGroups;
    const form = this.currentForm.value;
    const payload: ICreateMessageRequest = {
      subject: form.subject,
      body: form.message,
      sentto: SentTo.SIGNED_UP,
      sendtotype: SendToType.SIGNED_UP,
      status: status,
      messagetypeid: this.selectedValue === 'emailoptionone' ? 4 : 1,
      sendasemail: true,
      sendastext: false,
      themeid: form.themeid,
      contactname: form.fromName,
      replytoids: form.replyTo.map((id: string) => Number(id)),
      signupids: this.stateService.selectedSignups.map(
        (signup) => signup.signupid
      ),
      groupids: groups
        .filter(
          (group) =>
            group.value !== 'manual_entry' && !isNaN(Number(group.value))
        )
        .map((group) => Number(group.value)),
      portals: form.selectedPortalPages.map((pp: ISelectPortalOption) => pp.id),
      attachmentids: this.stateService.selectedAttachment.map(
        (file) => file.id
      ),
    };
    if (date) {
      payload.senddate = date;
    }
    if (form.isSignUpIndexPageSelected) {
      payload.signUpType = 'acctindex';
    }

    // Handle radio selection logic
    switch (this.selectedRadioOption.selectedValue) {
      case 'peopleingroups':
      case 'sendMessagePeopleRadio':
        payload.sentto = SentTo.ALL;
        payload.sendtotype = SendToType.PEOPLE_IN_GROUPS;
        break;

      case 'ManuallyEnterEmail': {
        const emailsString = this.selectedRadioOption.recipients[0] || '';
        const aliasString = this.selectedRadioOption.recipients[1] || '';

        // Convert comma-separated string to array of email objects
        payload.to = emailsString
          ? emailsString
              .split(',')
              .map((email: string) => email.trim())
              .filter((email: string) => email)
              .map((email: string) => ({
                email: email,
              }))
          : [];

        // Convert comma-separated alias string to array
        payload.alias = aliasString
          ? aliasString
              .split(',')
              .map((email: string) => email.trim())
              .filter((email: string) => email)
          : [];

        payload.sendtotype = SendToType.CUSTOM;
        payload.sentto = SentTo.MANUAL;
        break;
      }

      case 'specificRsvpResponse':
        payload.sendtotype = SendToType.SPECIFIC_RSVP_RESPONSE;
        payload.sentto = `rsvp:${this.selectedRadioOption.recipients.join(
          ','
        )}`;
        payload.groupids = [];
        break;

      case 'peopleWhoSignedUp':
        payload.sendtotype = SendToType.SIGNED_UP;
        payload.sentto = SentTo.SIGNED_UP;
        payload.groupids = [];
        break;

      case 'peopleOnWaitlist':
        payload.sendtotype = SendToType.WAITLIST;
        payload.sentto = SentTo.NOT_SIGNED_UP;
        payload.groupids = [];
        break;

      case 'peopleSignedUpAndWaitlist':
        payload.sendtotype = SendToType.WAITLIST;
        payload.sentto = SentTo.SIGNED_UP;
        payload.groupids = [];
        break;

      case 'peopleWhoNotSignedUp':
        payload.sendtotype = SendToType.PEOPLE_IN_GROUPS;
        payload.sentto = SentTo.NOT_SIGNED_UP;
        payload.groupids = [];
        break;

      case 'sendMessagePeopleIselect':
        if (this.selectedRadioOption.fromCustomGroup === true) {
          payload.sendtotype = SendToType.CUSTOM;
          payload.sentto = SentTo.MEMBERS;
          payload.to = this.selectedRadioOption.recipients.map((slot) => ({
            memberid: slot.id,
            firstname: slot.firstname,
            lastname: slot.lastname,
            email: slot.email,
          }));
        } else {
          payload.sendtotype = SendToType.SPECIFIC_DATE_SLOT;
          payload.sentto = SentTo.ALL;
          payload.groupids = [];
          payload.slotids = this.selectedRadioOption.recipients.map(
            (slot) => 'slot_' + slot.slotitemid
          );
          payload.sendToGroups = this.selectedRadioOption.recipients.map(
            (slot) => ({
              id: 'slot_' + slot.slotitemid,
              isWaitlistedRow: slot.waitlist,
            })
          );
        }
        break;
    }
    // Apply non-group members rule after switch (can override sentto)
    if (this.selectedRadioOption.includeNonGroupMembers) {
      payload.sentto = SentTo.ALL_INCLUDE_NON_GROUP_MEMBERS;
    }

    this.composeService.createMessage(payload).subscribe({
      next: (response) => {
        if (response.success === true && response.data) {
          this.toastr.success('Message saved successfully', 'Success');
          this.showOptionsAgain();
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.toastr.error(err.error.message[0]?.details, 'Error');
        this.openPreviewDialog(this.currentForm);
      },
    });
  }

  onThemeChange(themeId: number): void {
    this.currentForm.get('themeid')?.setValue(themeId || 1);
    this.onPreviewAndSend(this.currentFormType);
  }

  /**
   * Called when preview dialog is closed. Reset preview related state so
   * reopening the dialog shows default values (themeid=1 and empty preview).
   */
  onPreviewClose(): void {
    // Ensure the dialog visibility flag is false
    this.isPreviewDialogVisible = false;

    // Reset the preview HTML shown in the dialog
    this.emailHtmlPreview = '';

    // Reset available themes and form theme to default (1)
    this.availableThemes = [1];
    this.currentForm.get('themeid')?.setValue(1);
    this.currentForm.get('token')?.addValidators(Validators.required);
    this.currentForm.get('token')?.updateValueAndValidity();
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

    // If portal pages are selected, clear subject and message (user enters manually)
    if (this.stateService.selectedPortalPages.length > 0) {
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
    return !!(
      signup.haspassword &&
      signup.haspassword !== 'false' &&
      signup.haspassword !== '0'
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

  /**
   * Validate form based on people selection radio choice
   */
  private validateFormBasedOnSelection(): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const peopleSelectionData = this.stateService.peopleSelectionData;
    const selectedValue = peopleSelectionData.selectedValue;

    // If no people selection has been made, require toPeople to have value
    if (!selectedValue) {
      if (
        !this.stateService.selectedGroups.length &&
        !this.stateService.selectedDateSlots.length
      ) {
        errors.push('Please select people to send the email to');
        return { isValid: false, errors };
      }
    }

    // Validate based on specific selection type
    switch (selectedValue) {
      case 'peopleingroups':
      case 'sendMessagePeopleRadio': {
        // Requires groups to be selected
        if (this.stateService.selectedGroups.length === 0) {
          errors.push('Please select at least one group');
        }
        break;
      }

      case 'ManuallyEnterEmail': {
        // Requires manual emails or group alias
        if (
          !peopleSelectionData.manualEmails &&
          !peopleSelectionData.groupEmailAlias
        ) {
          errors.push('Please enter email addresses manually');
        }
        break;
      }

      case 'specificRsvpResponse': {
        // Requires RSVP responses to be selected
        const hasRsvpResponse =
          peopleSelectionData.rsvpResponseyes ||
          peopleSelectionData.rsvpResponseno ||
          peopleSelectionData.rsvpResponsemaybe ||
          peopleSelectionData.rsvpResponsenoresponse;
        if (!hasRsvpResponse) {
          errors.push('Please select at least one RSVP response');
        }
        break;
      }

      case 'sendMessagePeopleIselect': {
        // Requires date slots or custom selection
        if (
          this.stateService.selectedDateSlots.length === 0 &&
          this.stateService.selectedMemberGroups.length === 0
        ) {
          errors.push('Please select specific people or date slots');
        }
        break;
      }

      case 'peopleWhoSignedUp':
      case 'peopleWhoNotSignedUp':
      case 'peopleOnWaitlist':
      case 'peopleSignedUpAndWaitlist': {
        // These don't require additional validation - just selecting them is enough
        break;
      }

      default: {
        // For any other case, ensure we have some form of recipient selection
        if (
          this.stateService.selectedGroups.length === 0 &&
          this.stateService.selectedDateSlots.length === 0 &&
          this.stateService.selectedMemberGroups.length === 0 &&
          this.stateService.recipientCount === 0
        ) {
          errors.push('Please select people to send the email to');
        }
        break;
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  onFileSelected(file: IFileItem) {
    // Handle the selected file here
    console.log('File selected:', file);
    this.stateService.setSelectedAttachment([
      ...this.stateService.selectedAttachment,
      file,
    ]);
  }
}
