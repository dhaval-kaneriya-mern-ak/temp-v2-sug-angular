import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  HostListener,
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
  ISelectOption,
  SugUiDialogComponent,
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
import {
  Subject,
  takeUntil,
  switchMap,
  of,
  catchError,
  tap,
  Observable,
} from 'rxjs';
import {
  MemberProfile,
  ISignUpItem,
  SignupOptionGroup,
  MessageResponse,
  IRecipientsData,
  IMessagePreviewRequest,
  ICreateMessageRequest,
  MessageStatus,
  SentTo,
  SendToType,
  ISelectPortalOption,
  IFileItem,
  ISaveDraftMessagePayload,
  IRecipientsResponseData,
  IMessageByIdDataExtended,
  IRecipient,
  SignUPType,
  EXCLUDED_RECIPIENT_VALUES,
  ITabGroupItem,
} from '@services/interfaces';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import {
  mapApiToSelectedValue,
  extractPeopleSelectionData,
  mapSelectedValueToApi,
  stripHtml,
  getLabelForSelectedValue,
  parseManualEmails,
  applyBackendWorkarounds,
  buildPeopleSelectionData,
  saveDraftMessage,
  handleDraftLoadError,
  initializeDraftEditMode,
  checkForWaitlistSlots,
  isWaitlistRelatedMessage,
  restoreAttachments,
  downloadFile,
  UnsavedChangesManager,
  IUnsavedChangesComponent,
  FORM_TRACKING_DELAY,
  UNSAVED_CHANGES_DIALOG_TITLE,
  UNSAVED_CHANGES_DIALOG_MESSAGE,
} from '../../utils/services/draft-message.util';
import { MyGroupSelection } from '../../utils/my-group-selection/my-group-selection';
import { ConfirmationDialogComponent } from '../../utils/confirmation-dialog/confirmation-dialog.component';
import { ComponentCanDeactivate } from '../../../guards/unsaved-changes.guard';

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
    ConfirmationDialogComponent,
    SugUiDialogComponent,
  ],
  providers: [
    ComposeEmailStateService, // Provide at component level
  ],
  templateUrl: './compose-email.html',
  styleUrls: ['./compose-email.scss'],
})
export class ComposeEmailComponent
  implements
    OnInit,
    OnDestroy,
    ComponentCanDeactivate,
    IUnsavedChangesComponent
{
  private fb = inject(FormBuilder);
  private composeService = inject(ComposeService);
  protected userStateService = inject(UserStateService);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService);
  protected stateService = inject(ComposeEmailStateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private httpClient = inject(HttpClient);

  @ViewChild(SignupSelectionDialogComponent)
  signupDialog!: SignupSelectionDialogComponent;
  messageStatus = MessageStatus;
  // Forms
  formValidationErrors: string[] = [];
  emailFormOne!: FormGroup;
  emailFormTwo!: FormGroup;
  isConfirmationDialogVisible = false;

  // Unsaved changes manager - centralizes all unsaved changes logic
  private unsavedChangesManager!: UnsavedChangesManager;

  // Expose constants for template
  readonly dialogTitle = UNSAVED_CHANGES_DIALOG_TITLE;
  readonly dialogMessage = UNSAVED_CHANGES_DIALOG_MESSAGE;
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

  // Track if we're editing an existing draft (has messageId in URL)
  isEditingExistingDraft = false;
  currentDraftMessageId: number | null = null;
  currentSendToType = '';
  selectedCustomUserIds: string[] = [];
  originalSendAsText: boolean | undefined;
  originalSendAsEmail: boolean | undefined;

  // Dialog visibility flags
  isHelpDialogVisible = false;
  isPeopleDialogVisible = false;
  isSelectFileDialogVisible = false;
  isRecipientDialogVisible = false;
  isPreviewDialogVisible = false;
  isDateSlotsDialogVisible = false;
  isMyGroupsDialogVisible = false;
  errorVisible = false;

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
  private isRestoringDateSlots = false;
  hasWaitlistSlots = false;
  errorMessage = '';

  ngOnInit(): void {
    // Initialize unsaved changes manager
    this.unsavedChangesManager = new UnsavedChangesManager(this);

    this.initializeForms();
    this.loadUserProfile();
    this.loadInitialData();

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const messageId = Number(params['id']);

        if (!isNaN(messageId) && messageId > 0) {
          this.isEditingExistingDraft = true;
          this.currentDraftMessageId = messageId;

          this.ensureSubAdminsLoaded().then(() => {
            this.getMessageById(messageId);
          });
        }
      });
  }

  /**
   * Sets up tracking for form value changes to detect unsaved changes
   */
  private setupFormChangeTracking(): void {
    // Prevent duplicate subscriptions
    if (this.unsavedChangesManager.isTrackingActive()) {
      return;
    }
    this.unsavedChangesManager.setTrackingActive();

    // Track changes in both forms
    this.emailFormOne.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.unsavedChangesManager.markAsDirty();
      });

    this.emailFormTwo.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.unsavedChangesManager.markAsDirty();
      });
  }

  /**
   * Handles browser close/refresh events
   * Shows native browser confirmation dialog if there are unsaved changes
   */
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    this.unsavedChangesManager.handleBeforeUnload($event);
  }

  /**
   * CanDeactivate guard implementation
   * Returns true if navigation is allowed, false otherwise
   */
  canDeactivate(): Observable<boolean> | boolean {
    return this.unsavedChangesManager.canDeactivate();
  }

  /**
   * Handles confirmation dialog OK button click
   * Either goes back to radio selection or allows navigation to proceed
   */
  onConfirmNavigation(): void {
    this.unsavedChangesManager.onConfirmNavigation();
  }

  /**
   * Handles confirmation dialog cancel (X button click)
   * Prevents navigation
   */
  onCancelNavigation(): void {
    this.unsavedChangesManager.onCancelNavigation();
  }

  ngOnDestroy(): void {
    // Clean up unsaved changes manager
    this.unsavedChangesManager.cleanup();

    this.destroy$.next();
    this.destroy$.complete();
  }

  closeErrorDialog(): void {
    this.errorVisible = false;
    this.errorMessage = '';
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
        this.updateWaitlistSlotsStatus(selectedSignups);
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
    //Load tab groups
    if (this.userProfile?.features?.signuptabbing) {
      this.composeService.getTabGroupList().subscribe({
        next: (response) => {
          if (response?.data) {
            this.stateService.setTabGroupsOptions(response.data.tabgroups);
          }
        },
      });
    }

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
   * Updates the waitlist slots status based on selected signups
   * Checks for waitlist slots when exactly one signup is selected for email option two
   */
  private updateWaitlistSlotsStatus(selectedSignups: ISignUpItem[]): void {
    const shouldCheckWaitlist =
      selectedSignups.length === 1 && this.selectedValue === 'emailoptiontwo';

    if (shouldCheckWaitlist) {
      checkForWaitlistSlots({
        signupId: selectedSignups[0].signupid,
        composeService: this.composeService,
        destroy$: this.destroy$,
        onResult: (hasWaitlistSlots) => {
          this.hasWaitlistSlots = hasWaitlistSlots;
        },
      });
    } else {
      this.hasWaitlistSlots = false;
    }
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
   * Ensure sub-admins are loaded before proceeding
   * Returns a promise that resolves when sub-admins are loaded
   */
  private ensureSubAdminsLoaded(): Promise<void> {
    return new Promise((resolve) => {
      if (this.stateService.subAdminsData.length > 0) {
        resolve();
        return;
      }

      this.composeService.getSubAdmins().subscribe({
        next: (response) => {
          if (response?.success && response.data) {
            const subAdminOptions = response.data.map((admin) => ({
              label: admin.email,
              value: admin.id.toString(),
            }));
            this.stateService.setSubAdminsData(subAdminOptions);
          }
          resolve();
        },
        error: () => {
          resolve();
        },
      });
    });
  }

  /**
   * Load tab groups for pro users
   */
  private loadTabGroups(): void {
    // Tab groups API call - implement when API is available
    // For now, set empty array
    this.stateService.setTabGroupsOptions([]);
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
    this.composeService.setOptionSelected(true);
    this.loadUserProfile();

    // Start tracking form changes only after user has selected a message type
    setTimeout(() => {
      this.setupFormChangeTracking();
    }, FORM_TRACKING_DELAY);
  }

  /**
   * Handles back button click
   * Shows confirmation dialog if there are unsaved changes
   */
  handleBackButton(): void {
    this.unsavedChangesManager.handleBackButton();
  }

  /**
   * Show options again (back button)
   */
  showOptionsAgain(): void {
    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });
    }

    this.showRadioButtons = true;
    this.selectedValue = null;
    this.composeService.setOptionSelected(false);

    // Reset main forms
    this.emailFormOne.reset({
      themeid: 1,
    });
    this.emailFormTwo.reset({
      themeid: 1,
    });

    // Clear all selections in state service
    this.stateService.clearAllSelections();

    // Reset tracking state
    this.unsavedChangesManager.resetTrackingState();

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
    if (this.userProfile?.features.multinotify === 1) {
      const user = this.stateService.subAdminsData
        .filter((x) => x.label === this.userProfile?.email)
        .map((item) => String(item.value));
      this.currentForm.get('replyTo')?.setValue(user);
      this.currentForm.get('replyTo')?.updateValueAndValidity();
    }
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
      signuptype: SignUPType.SIGNUP,
      replyto: this.stateService.subAdminsData
        .filter((su) => form.value.replyTo.includes(String(su.value)))
        .map((su) => su.label),
      subject: form.value.subject,
      message: form.value.message,
      emailtype: this.selectedValue === 'emailoptionone' ? '4' : '1',
      themeid: form.value.themeid,
    };

    // Only add portals if there are any selected
    if (form.value.selectedSignups && form.value.selectedSignups.length >= 1) {
      payload.signupids = form.value.selectedSignups.map(
        (su: ISignUpItem) => su.signupid
      );
    }

    //add attachments
    if (this.stateService.selectedAttachment.length > 0) {
      payload.attachmentids = this.stateService.selectedAttachment.map(
        (file) => file.id
      );
    } else {
      payload.attachmentids = [];
    }

    if (
      form.value.selectedPortalPages &&
      form.value.selectedPortalPages.length >= 1
    ) {
      payload.signuptype = SignUPType.PORTALS;
      payload.portalids = form.value.selectedPortalPages
        .map((pp: ISelectPortalOption) => pp.id)
        .filter((id: number | undefined): id is number => id !== undefined);
    }

    if (form.value.selectedTabGroups.length > 0) {
      payload.signuptype = SignUPType.TABGROUP;
      payload.tabgroupids = form.value.selectedTabGroups.map(
        (pp: ISelectPortalOption) => pp.id
      );
    }
    if (form.value.isSignUpIndexPageSelected) {
      payload.signuptype = SignUPType.ACCIDEX;
    }

    if (form.value.toPeople.length > 0) {
      payload.sendto = form.value.toPeople
        .filter(
          (person: ISelectOption) =>
            !EXCLUDED_RECIPIENT_VALUES.has(person.value as string)
        )
        .map((person: ISelectOption) => ({
          id: Number(person.value || 1),
          displayname: person.label,
          ischecked: true,
          membercount: this.stateService.recipientCount,
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
      error: (error) => {
        this.isLoading = false;
        this.isPreviewDialogVisible = false;
        error?.error?.message?.forEach((msg: { details: string }) => {
          this.formValidationErrors.push(msg.details);
        });
        this.cdr.markForCheck();
        console.error('Preview error:', error);
      },
    });
  }

  /**
   * Form submission handlers
   */
  onPreviewAndSend(formType: 'inviteToSignUp' | 'emailParticipants'): void {
    const form =
      formType === 'inviteToSignUp' ? this.emailFormOne : this.emailFormTwo;

    // Perform custom validation based on people selection and show error messages
    const customValidationResult = this.validateFormBasedOnSelection();
    if (!customValidationResult.isValid) {
      // Store errors in form error array to display above form
      this.formValidationErrors = customValidationResult.errors;
      this.cdr.markForCheck();
      return;
    }

    // Clear errors if validation passes
    this.formValidationErrors = [];

    // Collect themes from signups
    const signupThemes = ((form.value.selectedSignups || []) as ISignUpItem[])
      .map((su: ISignUpItem) => su.themeid)
      .filter((theme) => theme !== undefined && theme !== null);

    // Collect themes from portal pages
    const portalThemes = (
      (form.value.selectedPortalPages || []) as ISelectPortalOption[]
    )
      .flatMap((portal: ISelectPortalOption) => portal.associatedthemes || [])
      .filter((theme) => theme !== undefined && theme !== null);

    const tabGroupThemes = (
      (form.value.selectedTabGroups || []) as ITabGroupItem[]
    ).flatMap((su: ITabGroupItem) =>
      su.themeids
        ? su.themeids
            .split(',')
            .map((id) => parseInt(id.trim(), 10))
            .filter((id) => !isNaN(id))
        : []
    );

    // Combine and deduplicate themes
    this.availableThemes = [
      1,
      ...new Set([...signupThemes, ...portalThemes, ...tabGroupThemes]),
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

  /**
   * Call the save draft API
   */
  private saveDraftToApi(
    messageId: number,
    payload: ISaveDraftMessagePayload
  ): void {
    saveDraftMessage({
      messageId,
      payload,
      composeService: this.composeService,
      toastr: this.toastr,
      destroy$: this.destroy$,
      onSuccess: (returnedMessageId) => {
        this.currentDraftMessageId = returnedMessageId;
        this.unsavedChangesManager.resetFormDirtyState();
      },
      onLoadingChange: (isLoading) => {
        this.isLoading = isLoading;
      },
    });
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

  onSaveDraft(
    status: MessageStatus,
    date?: string,
    formType?: 'inviteToSignUp' | 'emailParticipants'
  ): void {
    if (this.isEditingExistingDraft && this.currentDraftMessageId) {
      const form =
        formType === 'inviteToSignUp' ? this.emailFormOne : this.emailFormTwo;

      const formValue = form.getRawValue();

      const peopleSelectionData = this.stateService.peopleSelectionData;

      if (!peopleSelectionData.selectedValue) {
        // this.toastr.error(
        //   'Please select recipients in the "To" field',
        //   'Validation Error'
        // );
        this.formValidationErrors = [
          'Please select recipients in the "To" field',
        ];
        this.cdr.markForCheck();
        return;
      }

      let sentto: string;
      let sendtotype: string;

      const hasSelectedMemberGroups =
        this.stateService.selectedMemberGroups.length > 0;

      if (
        this.isEditingExistingDraft &&
        this.currentSendToType.toLowerCase() === SendToType.CUSTOM &&
        hasSelectedMemberGroups
      ) {
        sendtotype = SendToType.CUSTOM;
        sentto = SentTo.MEMBERS;
      } else if (
        this.isEditingExistingDraft &&
        this.currentSendToType.toLowerCase() === SendToType.CUSTOM &&
        this.selectedCustomUserIds.length > 0
      ) {
        sendtotype = SendToType.CUSTOM;
        sentto = this.selectedCustomUserIds.join(',');
      } else {
        const mapped = mapSelectedValueToApi(
          peopleSelectionData.selectedValue,
          peopleSelectionData.includeNonGroupMembers
          // || peopleSelectionData.includeNonGroupMembersForPeople
        );
        sentto = mapped.sentto;
        sendtotype = mapped.sendtotype;
      }

      const messagetypeid = formType === 'inviteToSignUp' ? 4 : 1;

      const payload: ISaveDraftMessagePayload = {
        subject: formValue.subject || '',
        body: formValue.message || '',
        sentto: sentto,
        sendtotype: sendtotype,
        messagetypeid: messagetypeid,
        status: 'draft',
        sendastext:
          this.isEditingExistingDraft && this.originalSendAsText !== undefined
            ? this.originalSendAsText
            : false,
        sendasemail:
          this.isEditingExistingDraft && this.originalSendAsEmail !== undefined
            ? this.originalSendAsEmail
            : true,
      };

      // Always send attachmentids array to reflect current state (additions/removals)
      // Get attachment IDs from the state service (the single source of truth)
      const attachmentIds = this.stateService.selectedAttachment.map(
        (file) => file.id
      );
      // Only include attachmentids if there are any attachments
      if (attachmentIds.length > 0) {
        payload.attachmentids = attachmentIds;
      } else {
        payload.attachmentids = [];
      }

      if (this.isEditingExistingDraft) {
        const replyToArray = Array.isArray(formValue.replyTo)
          ? formValue.replyTo
          : formValue.replyTo
          ? [formValue.replyTo]
          : [];
        payload.replytoids =
          replyToArray.length > 0
            ? replyToArray.map((r: any) => parseInt(r, 10))
            : [];
      } else if (formValue.replyTo && formValue.replyTo.length > 0) {
        payload.replytoids = formValue.replyTo.map((r: any) => parseInt(r, 10));
      }

      if (formValue.fromName) {
        payload.contactname = formValue.fromName;
      }

      const sendtotypeLower = sendtotype.toLowerCase();

      if (this.stateService.selectedSignups.length > 0) {
        payload.signupids = this.stateService.selectedSignups.map(
          (s) => s.signupid
        );
      }

      if (this.stateService.selectedPortalPages.length > 0) {
        payload.portalids = form.value.selectedPortalPages
          .map((pp: ISelectPortalOption) => pp.id)
          .filter((id: number | undefined): id is number => id !== undefined);
      }

      if (this.stateService.selectedTabGroups.length > 0) {
        payload.tabgroupids = this.stateService.selectedTabGroups.map(
          (tg) => tg.id
        );
      }

      if (this.stateService.isSignUpIndexPageSelected) {
        payload.signUpType = 'acctindex';
      }

      const groupIds = this.stateService.selectedGroups
        .map((g) => parseInt(g.value, 10))
        .filter((id) => !isNaN(id));
      payload.groupids = groupIds.length > 0 ? groupIds : [];

      if (
        sendtotypeLower === SendToType.MANUAL &&
        peopleSelectionData.manualEmails
      ) {
        payload.addEmails = peopleSelectionData.manualEmails;
      }

      if (
        sendtotypeLower === SendToType.SPECIFIC_DATE_SLOT &&
        this.stateService.selectedDateSlots.length > 0
      ) {
        payload.slotids = this.stateService.selectedDateSlots.map((slot) =>
          slot.slotitemid.toString()
        );

        if (messagetypeid === 1) {
          payload.sendToGroups = this.stateService.selectedDateSlots.map(
            (slot) => ({
              id: 'slot_' + slot.slotitemid,
              isWaitlistedRow: slot.waitlist || false,
            })
          );
        }
      }

      if (sendtotypeLower === SendToType.SPECIFIC_RSVP) {
        const responses: string[] = [];
        if (peopleSelectionData.rsvpResponseyes) responses.push('yes');
        if (peopleSelectionData.rsvpResponseno) responses.push('no');
        if (peopleSelectionData.rsvpResponsemaybe) responses.push('maybe');
        if (peopleSelectionData.rsvpResponsenoresponse) responses.push('nr');

        if (responses.length > 0) {
          payload.sentto = `rsvp:${responses.join(',')}`;
        }
      }

      if (sendtotypeLower === SendToType.CUSTOM && hasSelectedMemberGroups) {
        payload.to = this.stateService.selectedMemberGroups.map((member) => ({
          memberid: member.id,
          firstname: member.firstname || '',
          lastname: member.lastname || '',
          email: member.email || '',
        }));
      }

      this.saveDraftToApi(this.currentDraftMessageId, payload);
    } else {
      this.isLoading = true;
      const groups = this.stateService.selectedGroups;
      const form = this.currentForm.value;
      const payload: ICreateMessageRequest = {
        subject: form.subject,
        body: form.message,
        signuptype: SignUPType.SIGNUP,
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
        portalids: form.selectedPortalPages.map(
          (pp: ISelectPortalOption) => pp.id
        ),
        tabgroupids: form.selectedTabGroups.map((tg: ITabGroupItem) => tg.id),
        attachmentids: this.stateService.selectedAttachment.map(
          (file) => file.id
        ),
      };

      if (date) {
        payload.senddate = date + ':00';
      }
      if (form.isSignUpIndexPageSelected) {
        payload.signuptype = SignUPType.ACCIDEX;
        payload.sentto = SentTo.MANUAL;
        payload.sendtotype = SendToType.CUSTOM;
      }

      if (form.selectedPortalPages.length > 0) {
        payload.signuptype = SignUPType.PORTALS;
      }

      if (form.selectedTabGroups.length > 0) {
        payload.signuptype = SignUPType.TABGROUP;
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
          const aliasGroup = this.selectedRadioOption.recipients[2] || '';

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
          // Handle aliasGroup - can be array or comma-separated string
          payload.groupids = aliasGroup
            ? Array.isArray(aliasGroup)
              ? aliasGroup
                  .map((id: string) => Number(id))
                  .filter((id: number) => !isNaN(id))
              : aliasGroup
                  .split(',')
                  .map((id: string) => Number(id.trim()))
                  .filter((id: number) => !isNaN(id))
            : [];
          payload.sendtotype = SendToType.CUSTOM;
          payload.sentto = SentTo.MANUAL;
          break;
        }

        case 'ImportEmailFromProvider': {
          payload.sentto = SentTo.IMPORT;
          payload.sendtotype = SendToType.CUSTOM;
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
          payload.sentto = SentTo.WAITLIST;
          payload.groupids = [];
          break;

        case 'peopleSignedUpAndWaitlist':
          payload.sendtotype = SendToType.SIGNUP_WAITLIST;
          payload.sentto = SentTo.SIGNED_UP_AND_WAITLIST;
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
        payload.sendtotype = SendToType.PEOPLE_IN_GROUPS;
      }

      this.composeService.createMessage(payload).subscribe({
        next: (response) => {
          if (response.success === true && response.data) {
            this.unsavedChangesManager.resetFormDirtyState();
            // Trigger success page display without routing
            const successType =
              status === MessageStatus.DRAFT
                ? 'draft'
                : status === MessageStatus.SCHEDULED
                ? 'scheduled'
                : 'send';
            this.composeService.triggerSuccessPage(
              successType,
              this.stateService.selectedSignups
            );
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          // this.toastr.error(err.error.message[0]?.details, 'Error');
          err?.error?.message?.forEach((msg: any) => {
            this.formValidationErrors.push(msg.details);
          });
          this.cdr.markForCheck();
          this.errorVisible = true;
          this.errorMessage = err.error.message[0]?.details || '';
          // if (status !== MessageStatus.DRAFT) {
          //   this.openPreviewDialog(this.currentForm);
          // }
        },
      });
    }
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
    // Don't auto-update subject/message if editing an existing draft
    // User should manually change these fields if needed
    if (this.isEditingExistingDraft) {
      return;
    }

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
      this.currentForm.get('replyTo')?.setValue([]);
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

  getMessageById(id: number) {
    this.isLoading = true;

    type ReplyToItem = { memberid: number; email: string };

    const optionOne = 4;
    const optionTwo = 1;

    this.composeService
      .getMessageById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: MessageResponse) => {
          if (!response.success) {
            this.isLoading = false;

            handleDraftLoadError({
              toastr: this.toastr,
              router: this.router,
              stateService: this.stateService,
              onCleanup: () => {
                this.isEditingExistingDraft = false;
                this.currentDraftMessageId = null;
              },
            });
            return;
          }

          initializeDraftEditMode(
            id,
            this.stateService,
            response.data.sendtotype,
            response.data.sendastext,
            response.data.sendasemail,
            (data) => {
              this.isEditingExistingDraft = data.isEditingExistingDraft;
              this.currentDraftMessageId = data.currentDraftMessageId;
              this.currentSendToType = data.currentSendToType;
              this.originalSendAsText = data.originalSendAsText;
              this.originalSendAsEmail = data.originalSendAsEmail;
            }
          );

          if (
            response.data.sendtotype?.toLowerCase() === SendToType.CUSTOM &&
            response.data.sentto
          ) {
            if (response.data.messagetypeid === 4) {
              this.selectedCustomUserIds = response.data.sentto
                .split(',')
                .map((id) => id.trim())
                .filter((id) => id.length > 0);

              this.composeService
                .getAllGroupsWithMembers()
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: (allMembersResponse) => {
                    if (allMembersResponse.success && allMembersResponse.data) {
                      const memberIds = this.selectedCustomUserIds.map((id) =>
                        Number(id)
                      );

                      const matchedMembers = allMembersResponse.data
                        .filter((item) => memberIds.includes(item.member.id))
                        .map((item) => ({
                          id: item.member.id,
                          firstname: item.member.firstname || '',
                          lastname: item.member.lastname || '',
                          email: item.member.email || '',
                          label: item.member.email || '',
                          value: item.member.id?.toString() || '',
                          groupsId:
                            item.groups?.[0]?.id?.toString() || undefined,
                        }));

                      this.stateService.setSelectedMemberGroups(matchedMembers);

                      this.stateService.setRecipientCount(
                        matchedMembers.length
                      );
                    }
                  },
                  error: (error) => {
                    console.error(
                      'Failed to fetch members from /all API:',
                      error
                    );
                  },
                });
            } else {
              const responseData = response.data as IMessageByIdDataExtended;
              if (responseData.to && Array.isArray(responseData.to)) {
                const memberGroups = responseData.to.map((member) => ({
                  id: member.memberid,
                  firstname: member.firstname || '',
                  lastname: member.lastname || '',
                  email: member.email || '',
                  label: `${member.firstname || ''} ${member.lastname || ''} (${
                    member.email || ''
                  })`.trim(),
                  value: member.memberid?.toString() || '',
                }));

                this.stateService.setSelectedMemberGroups(memberGroups);

                this.selectedCustomUserIds = memberGroups.map((m) =>
                  m.id.toString()
                );
              } else {
                this.selectedCustomUserIds = response.data.sentto
                  .split(',')
                  .map((id) => id.trim())
                  .filter((id) => id.length > 0);
              }
            }
          }

          if (response.data.messagetypeid == optionOne) {
            this.selectedValue = 'emailoptionone';

            this.showRadioButtons = false;

            this.loadUserProfile();

            const replyToMemberIds = (
              (response.data.replyto as ReplyToItem[]) || []
            ).map((item) => String(item.memberid));

            const isRsvpSignup =
              response.data.sendtotype?.toLowerCase() ===
                SendToType.SPECIFIC_RSVP ||
              response.data.sendtotype?.toLowerCase() ===
                SendToType.SPECIFIC_RSVP_RESPONSE;

            const mappedSignups: ISignUpItem[] = (
              response.data?.signups || []
            ).map((s) => ({
              signupid: s.signupid,
              memberimagedisabled: false,
              ownerid: response.data.createdby,
              mode: isRsvpSignup ? 'rsvp' : 'default',
              isapproved: false,
              community: '',
              communityid: 0,
              memberimageowner: 0,
              customimagedisabled: false,
              iscomplete: false,
              serverfilename: '',
              customimagefilename: '',
              partialimagepath: '',
              signupimage: '',
              title: s.signuptitle,
              fulltitle: s.signuptitle,
              themeid: response.data.themeid,
              signupstatus: '',
              themeclientfilename: '',
              themeserverfilename: '',
              themedisabled: false,
              themeimageapproved: false,
              themeowner: '',
              themememberid: 0,
              thememberid: 0,
              themememberimageid: 0,
              contactname: response.data.contactname,
              hasads: false,
              hasadsdisabled: false,
              imageheight: 0,
              imagewidth: 0,
              zonename: response.data.zonename,
              urlid: undefined,
              memberimageid: undefined,
              enddate: undefined,
              startdate: undefined,
              favoriteid: undefined,
              haspassword: false,
              passcode: '',
            }));

            if (response.data?.portals && response.data.portals.length > 0) {
              const mappedPortals = response.data.portals.map((p) => ({
                id: p.portalid,
                title: p.portaltitle,
                urlkey: p.portalurl,
                label: p.portaltitle,
                value: p.portalid.toString(),
              }));
              this.stateService.setSelectedPortalPages(mappedPortals);
            } else if (
              response.data?.tabgroups &&
              response.data.tabgroups.length > 0
            ) {
              const mappedTabGroups: ITabGroupItem[] =
                response.data.tabgroups.map(
                  (tg: {
                    tabgroupid: number;
                    tabgroupname: string;
                    themeids?: string;
                  }) => ({
                    id: tg.tabgroupid,
                    name: tg.tabgroupname,
                    label: tg.tabgroupname,
                    value: tg.tabgroupid.toString(),
                    themeids: tg.themeids || '1',
                    memberid: 0,
                    showname: false,
                    showmore: false,
                    urlid: '',
                    numsignups: 0,
                  })
                );
              this.stateService.setSelectedTabGroups(mappedTabGroups, true);
            } else if (
              response.data?.signUpType === 'acctindex' ||
              ((!response.data?.signups ||
                response.data.signups.length === 0) &&
                (!response.data?.portals ||
                  response.data.portals.length === 0) &&
                (!response.data?.tabgroups ||
                  response.data.tabgroups.length === 0))
            ) {
              this.stateService.setSignUpIndexPageSelected(true, true);
            } else if (
              response.data?.signups &&
              response.data.signups.length > 0
            ) {
              this.stateService.setSelectedSignups(mappedSignups, true);
            }

            this.emailFormOne.get('replyTo')?.enable();
            this.emailFormOne.get('toPeople')?.enable();
            this.emailFormOne.get('subject')?.enable();
            this.emailFormOne.get('message')?.enable();

            this.emailFormOne.patchValue({
              subject: response.data.subject,
              selectedSignups: mappedSignups,
              message: stripHtml(response.data.body),
              messageType: response.data.messagetype,
            });

            setTimeout(() => {
              this.emailFormOne.get('replyTo')?.setValue(replyToMemberIds);
              this.emailFormOne.get('replyTo')?.updateValueAndValidity();
            }, 0);

            this.restorePeopleSelection(
              response.data.sentto,
              response.data.sendtotype,
              response.data.addEmails
            );

            // Restore attachments if present
            if (
              response.data.attachments &&
              response.data.attachments.length > 0
            ) {
              this.restoreAttachments(response.data.attachments);
            }

            if (
              response.data.sendtotype?.toLowerCase() ===
                SendToType.SPECIFIC_DATE_SLOT &&
              response.data.signups &&
              response.data.signups.length > 0
            ) {
              this.restoreDateSlots(
                response.data.sentto,
                response.data.signups
              );
            }

            const skipGroupRestoration =
              (response.data.sendtotype?.toLowerCase() ===
                SendToType.SIGNED_UP &&
                response.data.sentto?.toLowerCase() === SentTo.SIGNED_UP) ||
              (response.data.sendtotype?.toLowerCase() ===
                SendToType.PEOPLE_IN_GROUPS &&
                response.data.sentto?.toLowerCase() === SentTo.NOT_SIGNED_UP) ||
              response.data.sendtotype?.toLowerCase() === SendToType.MANUAL;

            if (
              response.data.sendtotype?.toLowerCase() === SendToType.CUSTOM &&
              this.stateService.selectedMemberGroups.length > 0
            ) {
              const memberIds = this.stateService.selectedMemberGroups.map(
                (m) => m.id
              );

              this.composeService
                .getAllGroupsWithMembers()
                .pipe(
                  switchMap((allGroupsResponse) => {
                    if (!allGroupsResponse.success || !allGroupsResponse.data) {
                      this.stateService.setRecipientCount(
                        this.stateService.selectedMemberGroups.length
                      );
                      return of(null);
                    }

                    const selectedMemberData = allGroupsResponse.data.filter(
                      (item) => memberIds.includes(item.member.id)
                    );

                    const groupIdsSet = new Set<number>();
                    selectedMemberData.forEach((item) => {
                      item.groups?.forEach((group) => {
                        groupIdsSet.add(group.id);
                      });
                    });
                    const groupIds = Array.from(groupIdsSet);

                    if (groupIds.length === 0) {
                      this.stateService.setRecipientCount(
                        this.stateService.selectedMemberGroups.length
                      );
                      return of(null);
                    }

                    const signupIds = this.stateService.selectedSignups.map(
                      (s) => s.signupid
                    );
                    return this.composeService
                      .fetchRecipients({
                        sentToType: SendToType.PEOPLE_IN_GROUPS,
                        sentTo: SentTo.ALL,
                        messageTypeId: 4,
                        signupIds: signupIds,
                        groupIds: groupIds,
                      })
                      .pipe(
                        tap((recipientsResponse) => {
                          const data =
                            recipientsResponse.data as IRecipientsResponseData;
                          if (Array.isArray(data.recipients)) {
                            this.stateService.setRecipientCount(
                              data.recipients.length
                            );
                            this.stateService.setRecipients(
                              data.recipients as IRecipient[]
                            );
                          } else if (
                            recipientsResponse.success &&
                            recipientsResponse.pagination
                          ) {
                            this.stateService.setRecipientCount(
                              recipientsResponse.pagination.totalRecords || 0
                            );
                          }
                        }),
                        catchError((error) => {
                          console.error(
                            'Failed to fetch recipient count:',
                            error
                          );
                          this.stateService.setRecipientCount(
                            this.stateService.selectedMemberGroups.length
                          );
                          return of(null);
                        })
                      );
                  }),
                  takeUntil(this.destroy$),
                  catchError((error) => {
                    console.error('Failed to fetch group members:', error);
                    this.stateService.setRecipientCount(
                      this.stateService.selectedMemberGroups.length
                    );
                    return of(null);
                  })
                )
                .subscribe();
            } else if (skipGroupRestoration) {
              const signupIds = this.stateService.selectedSignups.map(
                (s) => s.signupid
              );
              this.composeService
                .fetchRecipients({
                  sentToType: response.data.sendtotype,
                  sentTo: response.data.sentto,
                  messageTypeId: 4,
                  signupIds: signupIds,
                })
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: (response) => {
                    const data = response.data as IRecipientsResponseData;
                    if (Array.isArray(data.recipients)) {
                      this.stateService.setRecipientCount(
                        data.recipients.length
                      );
                      this.stateService.setRecipients(data.recipients as any);
                    } else if (response.success && response.pagination) {
                      this.stateService.setRecipientCount(
                        response.pagination.totalRecords || 0
                      );
                    }
                  },
                  error: (error) => {
                    console.error('Failed to fetch recipient count:', error);
                    this.stateService.setRecipientCount(0);
                  },
                });
            } else if (
              response.data.groups &&
              response.data.groups.length > 0
            ) {
              this.restoreGroups(
                response.data.groups,
                response.data.sendtotype,
                response.data.sentto
              );
            }

            this.isLoading = false;

            // Start tracking form changes after loading existing message
            setTimeout(() => {
              this.setupFormChangeTracking();
            }, FORM_TRACKING_DELAY);

            // Reset dirty state after draft loading form patches complete
            setTimeout(() => {
              this.unsavedChangesManager.resetFormDirtyState();
            }, FORM_TRACKING_DELAY * 4);
          } else if (response.data.messagetypeid == optionTwo) {
            this.selectedValue = 'emailoptiontwo';

            this.showRadioButtons = false;

            this.loadUserProfile();

            const replyToMemberIds = (
              (response.data.replyto as ReplyToItem[]) || []
            ).map((item) => String(item.memberid));

            const isRsvpSignup =
              response.data.sendtotype?.toLowerCase() ===
                SendToType.SPECIFIC_RSVP ||
              response.data.sendtotype?.toLowerCase() ===
                SendToType.SPECIFIC_RSVP_RESPONSE;

            const mappedSignups: ISignUpItem[] = (
              response.data?.signups || []
            ).map((s) => ({
              signupid: s.signupid,
              memberimagedisabled: false,
              ownerid: response.data.createdby,
              mode: isRsvpSignup ? 'rsvp' : 'default',
              isapproved: false,
              community: '',
              communityid: 0,
              memberimageowner: 0,
              customimagedisabled: false,
              iscomplete: false,
              serverfilename: '',
              customimagefilename: '',
              partialimagepath: '',
              signupimage: '',
              title: s.signuptitle,
              fulltitle: s.signuptitle,
              themeid: response.data.themeid,
              signupstatus: '',
              themeclientfilename: '',
              themeserverfilename: '',
              themedisabled: false,
              themeimageapproved: false,
              themeowner: '',
              themememberid: 0,
              thememberid: 0,
              themememberimageid: 0,
              contactname: response.data.contactname,
              hasads: false,
              hasadsdisabled: false,
              imageheight: 0,
              imagewidth: 0,
              zonename: response.data.zonename,
              urlid: undefined,
              memberimageid: undefined,
              enddate: undefined,
              startdate: undefined,
              favoriteid: undefined,
              haspassword: false,
              passcode: '',
            }));

            if (response.data?.portals && response.data.portals.length > 0) {
              const mappedPortals = response.data.portals.map((p) => ({
                id: p.portalid,
                title: p.portaltitle,
                urlkey: p.portalurl,
                label: p.portaltitle,
                value: p.portalid.toString(),
              }));
              this.stateService.setSelectedPortalPages(mappedPortals);
            } else if (
              response.data?.tabgroups &&
              response.data.tabgroups.length > 0
            ) {
              const mappedTabGroups: ITabGroupItem[] =
                response.data.tabgroups.map(
                  (tg: {
                    tabgroupid: number;
                    tabgroupname: string;
                    themeids?: string;
                  }) => ({
                    id: tg.tabgroupid,
                    name: tg.tabgroupname,
                    label: tg.tabgroupname,
                    value: tg.tabgroupid.toString(),
                    themeids: tg.themeids || '1',
                    memberid: 0,
                    showname: false,
                    showmore: false,
                    urlid: '',
                    numsignups: 0,
                  })
                );
              this.stateService.setSelectedTabGroups(mappedTabGroups, true);
            } else if (
              response.data?.signUpType === 'acctindex' ||
              ((!response.data?.signups ||
                response.data.signups.length === 0) &&
                (!response.data?.portals ||
                  response.data.portals.length === 0) &&
                (!response.data?.tabgroups ||
                  response.data.tabgroups.length === 0))
            ) {
              this.stateService.setSignUpIndexPageSelected(true, true);
            } else if (
              response.data?.signups &&
              response.data.signups.length > 0
            ) {
              this.stateService.setSelectedSignups(mappedSignups, true);
            }

            this.emailFormTwo.get('replyTo')?.enable();
            this.emailFormTwo.get('toPeople')?.enable();
            this.emailFormTwo.get('subject')?.enable();
            this.emailFormTwo.get('message')?.enable();

            this.emailFormTwo.patchValue({
              subject: response.data.subject,
              selectedSignups: mappedSignups,
              message: stripHtml(response.data.body),
              messageType: response.data.messagetype,
            });

            setTimeout(() => {
              this.emailFormTwo.get('replyTo')?.setValue(replyToMemberIds);
              this.emailFormTwo.get('replyTo')?.updateValueAndValidity();
            }, 0);

            // Check if draft has waitlist-related sendtotype to set hasWaitlistSlots flag
            if (
              isWaitlistRelatedMessage(
                response.data.sendtotype || '',
                response.data.sentto || ''
              )
            ) {
              this.hasWaitlistSlots = true;
            }

            this.restorePeopleSelection(
              response.data.sentto,
              response.data.sendtotype,
              response.data.addEmails
            );

            // Restore attachments if present
            if (
              response.data.attachments &&
              response.data.attachments.length > 0
            ) {
              this.restoreAttachments(response.data.attachments);
            }

            if (
              response.data.sendtotype?.toLowerCase() ===
                SendToType.SPECIFIC_DATE_SLOT &&
              response.data.signups &&
              response.data.signups.length > 0
            ) {
              this.restoreDateSlots(
                response.data.sentto,
                response.data.signups
              );
            }

            const skipGroupRestoration =
              (response.data.sendtotype?.toLowerCase() ===
                SendToType.SIGNED_UP &&
                response.data.sentto?.toLowerCase() === SentTo.SIGNED_UP) ||
              (response.data.sendtotype?.toLowerCase() ===
                SendToType.PEOPLE_IN_GROUPS &&
                response.data.sentto?.toLowerCase() === SentTo.NOT_SIGNED_UP) ||
              response.data.sendtotype?.toLowerCase() === SendToType.MANUAL ||
              isWaitlistRelatedMessage(
                response.data.sendtotype || '',
                response.data.sentto || ''
              );

            if (
              response.data.sendtotype?.toLowerCase() === SendToType.CUSTOM &&
              (this.stateService.selectedMemberGroups.length > 0 ||
                this.selectedCustomUserIds.length > 0)
            ) {
              let memberIds: number[] = [];
              if (this.stateService.selectedMemberGroups.length > 0) {
                memberIds = this.stateService.selectedMemberGroups.map(
                  (m) => m.id
                );
              } else if (this.selectedCustomUserIds.length > 0) {
                memberIds = this.selectedCustomUserIds.map((id) => Number(id));
              }

              this.composeService
                .getAllGroupsWithMembers()
                .pipe(
                  switchMap((allGroupsResponse) => {
                    if (!allGroupsResponse.success || !allGroupsResponse.data) {
                      this.stateService.setRecipientCount(memberIds.length);
                      return of(null);
                    }

                    const selectedMemberData = allGroupsResponse.data.filter(
                      (item) => memberIds.includes(item.member.id)
                    );

                    const matchedMembers = allGroupsResponse.data
                      .filter((item) => memberIds.includes(item.member.id))
                      .map((item) => ({
                        id: item.member.id,
                        firstname: item.member.firstname || '',
                        lastname: item.member.lastname || '',
                        email: item.member.email || '',
                        label: item.member.email || '',
                        value: item.member.id?.toString() || '',
                        groupsId: item.groups?.[0]?.id?.toString() || undefined,
                      }));

                    this.stateService.setSelectedMemberGroups(matchedMembers);

                    const groupIdsSet = new Set<number>();
                    selectedMemberData.forEach((item) => {
                      item.groups?.forEach((group) => {
                        groupIdsSet.add(group.id);
                      });
                    });
                    const groupIds = Array.from(groupIdsSet);

                    if (groupIds.length === 0) {
                      this.stateService.setRecipientCount(memberIds.length);
                      return of(null);
                    }

                    const signupIds = this.stateService.selectedSignups.map(
                      (s) => s.signupid
                    );
                    return this.composeService
                      .fetchRecipients({
                        sentToType: SendToType.PEOPLE_IN_GROUPS,
                        sentTo: SentTo.ALL,
                        messageTypeId: 1,
                        signupIds: signupIds,
                        groupIds: groupIds,
                      })
                      .pipe(
                        tap((recipientsResponse) => {
                          const data =
                            recipientsResponse.data as IRecipientsResponseData;
                          if (Array.isArray(data.recipients)) {
                            this.stateService.setRecipientCount(
                              data.recipients.length
                            );
                            this.stateService.setRecipients(
                              data.recipients as IRecipient[]
                            );
                          } else if (
                            recipientsResponse.success &&
                            recipientsResponse.pagination
                          ) {
                            this.stateService.setRecipientCount(
                              recipientsResponse.pagination.totalRecords || 0
                            );
                          }
                        }),
                        catchError((error) => {
                          console.error(
                            'Failed to fetch recipient count:',
                            error
                          );

                          this.stateService.setRecipientCount(memberIds.length);
                          return of(null);
                        })
                      );
                  }),
                  takeUntil(this.destroy$),
                  catchError((error) => {
                    console.error('Failed to fetch group members:', error);
                    this.stateService.setRecipientCount(memberIds.length);
                    return of(null);
                  })
                )
                .subscribe();
            } else if (skipGroupRestoration) {
              const signupIds = this.stateService.selectedSignups.map(
                (s) => s.signupid
              );
              this.composeService
                .fetchRecipients({
                  sentToType: response.data.sendtotype,
                  sentTo: response.data.sentto,
                  messageTypeId: 1,
                  signupIds: signupIds,
                })
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: (response) => {
                    const data = response.data as IRecipientsResponseData;
                    if (Array.isArray(data.recipients)) {
                      this.stateService.setRecipientCount(
                        data.recipients.length
                      );
                      this.stateService.setRecipients(data.recipients as any);
                    } else if (response.success && response.pagination) {
                      this.stateService.setRecipientCount(
                        response.pagination.totalRecords || 0
                      );
                    }
                  },
                  error: (error) => {
                    console.error('Failed to fetch recipient count:', error);
                    this.stateService.setRecipientCount(0);
                  },
                });
            } else if (
              response.data.groups &&
              response.data.groups.length > 0
            ) {
              this.restoreGroups(
                response.data.groups,
                response.data.sendtotype,
                response.data.sentto
              );
            }

            this.isLoading = false;

            // Start tracking form changes after loading existing message
            setTimeout(() => {
              this.setupFormChangeTracking();
            }, FORM_TRACKING_DELAY);

            // Reset dirty state after draft loading form patches complete
            setTimeout(() => {
              this.unsavedChangesManager.resetFormDirtyState();
            }, FORM_TRACKING_DELAY * 4);
          } else {
            this.isLoading = false;
            // this.toastr.error(
            //   `This message type (${response.data.messagetypeid}) cannot be edited in this form.`,
            //   'Unsupported Message Type'
            // );
            this.formValidationErrors = [
              `This message type ${response.data.messagetypeid} cannot be edited in this form.`,
            ];
            this.router.navigate(['/messages/compose']);
          }
        },

        error: (error) => {
          this.isLoading = false;
          handleDraftLoadError({
            toastr: this.toastr,
            router: this.router,
            stateService: this.stateService,
            onCleanup: () => {
              this.isEditingExistingDraft = false;
              this.currentDraftMessageId = null;
            },
          });
        },
      });
  }

  /**
   * Restore groups selection and fetch recipient count
   * Now uses the generalized fetchRecipients function from compose.service.ts
   */
  private restoreGroups(
    groups: { groupid: number; groupname: string }[],
    sendtotype: string,
    sentto: string
  ): void {
    const groupOptions = groups.map((group) => ({
      label: group.groupname,
      value: group.groupid.toString(),
    }));

    const existingGroupOptions = this.stateService.groupOptions;
    const existingGroupIds = existingGroupOptions.map((g) => g.value);
    const newGroups = groupOptions.filter(
      (g) => !existingGroupIds.includes(g.value)
    );
    if (newGroups.length > 0) {
      this.stateService.setGroupOptions([
        ...existingGroupOptions,
        ...newGroups,
      ]);
    }

    this.stateService.setSelectedGroups(groupOptions);

    const signupIds = this.stateService.selectedSignups.map((s) => s.signupid);
    const groupIds = groups.map((g) => g.groupid);

    const messageTypeId = this.selectedValue === 'emailoptionone' ? 4 : 1;

    const existingPeopleSelectionData =
      this.stateService.peopleSelectionData || {};
    const updatedPeopleSelectionData = {
      ...existingPeopleSelectionData,
      selectedValue:
        messageTypeId === 4 ? 'peopleingroups' : 'sendMessagePeopleRadio',
      selectedGroups: groupIds.map((id) => id.toString()),
    };
    this.stateService.setPeopleSelectionData(updatedPeopleSelectionData);

    this.composeService
      .fetchRecipients({
        sentToType: sendtotype,
        sentTo: sentto,
        messageTypeId: messageTypeId,
        signupIds: signupIds,
        groupIds: groupIds,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const data = response.data as IRecipientsData & {
            recipients?: unknown[];
          };
          if (Array.isArray(data.recipients)) {
            const recipientCount = data.recipients.length;
            const recipients = data.recipients;

            this.stateService.setRecipientCount(recipientCount);
            this.stateService.setRecipients(recipients);
          } else if (response.success && response.pagination) {
            const recipientCount = response.pagination.totalRecords || 0;
            this.stateService.setRecipientCount(recipientCount);
          }
        },
        error: (error) => {
          console.error('Failed to fetch recipient count:', error);
          this.stateService.setRecipientCount(0);
        },
      });
  }

  /**
   * Restore people selection state from API sentto and sendtotype values
   * This is used when editing a draft message
   */
  private restorePeopleSelection(
    sentto: string,
    sendtotype: string,
    addEmails?: string
  ): void {
    const corrected = applyBackendWorkarounds(sentto, sendtotype);
    sentto = corrected.sentto;
    sendtotype = corrected.sendtotype;

    if (!sentto || !sendtotype) {
      console.warn(
        'sentto or sendtotype is missing, cannot restore people selection'
      );
      return;
    }

    const selectedValue = mapApiToSelectedValue(sentto, sendtotype);

    if (!selectedValue) {
      console.warn(
        `Unable to map sentto="${sentto}" and sendtotype="${sendtotype}" to a people selection option`
      );
      return;
    }

    const additionalData = extractPeopleSelectionData(sentto, sendtotype);

    const peopleSelectionData = buildPeopleSelectionData(
      selectedValue,
      additionalData,
      addEmails
    );

    if (sendtotype.toLowerCase() === SendToType.MANUAL) {
      if (addEmails) {
        const emailList = parseManualEmails(addEmails);
        this.stateService.setRecipientCount(emailList.length);
      } else {
        this.stateService.setRecipientCount(0);
      }
    }

    this.stateService.setPeopleSelectionData(peopleSelectionData);

    this.selectedRadioOption = {
      selectedValue: selectedValue,
      includeNonGroupMembers: additionalData.includeNonGroupMembers || false,
      recipients: [],
    };

    this.currentSendToType = sendtotype;

    const label = getLabelForSelectedValue(selectedValue);
    this.stateService.setSelectedGroups([
      {
        label: label,
        value: selectedValue,
      },
    ]);
  }

  // onFileSelected(file: IFileItem) {
  //   this.stateService.setSelectedAttachment([
  //     ...this.stateService.selectedAttachment,
  //     file,
  //   ]);
  // }

  /**
   * Restore date slots selection from API
   * Used when editing a draft with sendtotype: 'specificdateslot'
   */
  private restoreDateSlots(
    sentto: string,
    signups: { signupid: number; signuptitle: string }[]
  ): void {
    if (this.isRestoringDateSlots) {
      console.warn(
        'Date slots are already being restored, skipping duplicate call'
      );
      return;
    }

    if (!sentto || !signups || signups.length === 0) {
      console.warn('Invalid sentto or signups for restoring date slots');
      return;
    }

    this.isRestoringDateSlots = true;

    const slotIds = sentto
      .split(',')
      .map((s) => s.trim().replace('slot_', ''))
      .filter((s) => s.length > 0 && !isNaN(Number(s)));

    if (slotIds.length === 0) {
      console.warn('No valid slot IDs found in sentto:', sentto);
      this.isRestoringDateSlots = false;
      return;
    }

    const allDateSlots: any[] = [];
    let completedRequests = 0;

    signups.forEach((signup) => {
      this.composeService
        .getDateSlots(signup.signupid, {
          includeSignedUpMembers: false,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              const matchingSlots = response.data.filter((slot) => {
                const slotIdStr = slot.slotitemid.toString();
                return slotIds.includes(slotIdStr);
              });

              allDateSlots.push(...matchingSlots);
            }

            completedRequests++;
            if (completedRequests === signups.length) {
              if (allDateSlots.length > 0) {
                this.stateService.setSelectedDateSlots(allDateSlots);

                // Update the "To" field to show the actual date slot values
                const dateSlotLabels = allDateSlots.map((slot) => {
                  const timeStr = slot.starttime
                    ? new Date(slot.starttime).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'No time';
                  const itemStr = slot.item || 'No item';
                  return {
                    label: `${timeStr} - ${itemStr}`,
                    value: slot.slotitemid.toString(),
                  };
                });

                this.stateService.setSelectedGroups(dateSlotLabels);

                // Fetch recipient count for the selected date slots
                const slotItemIds = allDateSlots.map((slot) => slot.slotitemid);
                const signupIds = signups.map((s) => s.signupid);
                const messageTypeId =
                  this.selectedValue === 'emailoptionone' ? 4 : 1;

                this.composeService
                  .fetchRecipients({
                    sentToType: SendToType.SPECIFIC_DATE_SLOT,
                    sentTo: SentTo.SPECIFIC_DATE_SLOT,
                    messageTypeId: messageTypeId,
                    signupIds: signupIds,
                    slotItemIds: slotItemIds,
                  })
                  .pipe(takeUntil(this.destroy$))
                  .subscribe({
                    next: (recipientsResponse) => {
                      const data =
                        recipientsResponse.data as IRecipientsResponseData;
                      if (Array.isArray(data.recipients)) {
                        this.stateService.setRecipientCount(
                          data.recipients.length
                        );
                        this.stateService.setRecipients(
                          data.recipients as IRecipient[]
                        );
                      } else if (
                        recipientsResponse.success &&
                        recipientsResponse.pagination
                      ) {
                        this.stateService.setRecipientCount(
                          recipientsResponse.pagination.totalRecords || 0
                        );
                      }
                    },
                    error: (error) => {
                      console.error(
                        'Failed to fetch recipient count for date slots:',
                        error
                      );
                      this.stateService.setRecipientCount(0);
                    },
                  });
              } else {
                console.warn('No matching date slots found');
              }

              this.isRestoringDateSlots = false;
            }
          },
          error: (error) => {
            console.error(
              `Failed to fetch date slots for signup ${signup.signupid}:`,
              error
            );
            completedRequests++;

            if (completedRequests === signups.length) {
              this.isRestoringDateSlots = false;
            }
          },
        });
    });
  }

  /**
   * Restores attachments from draft message
   * Uses the shared restoreAttachments utility to avoid code duplication
   */
  private restoreAttachments(
    attachments: { fileid: number; fileurl: string }[]
  ): void {
    restoreAttachments({
      attachments,
      composeService: this.composeService,
      destroy$: this.destroy$,
      onSuccess: (transformedAttachments) => {
        if (transformedAttachments.length > 0) {
          this.stateService.setSelectedAttachment(transformedAttachments);
        }
      },
    });
  }

  onFileSelected(file: IFileItem) {
    // Use state service validation
    const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB
    const validationResult = this.stateService.validateAndAddAttachment(
      file,
      MAX_FILE_SIZE
    );

    if (validationResult.success) {
      this.stateService.setSelectedAttachment([
        ...this.stateService.selectedAttachment,
        file,
      ]);
    } else if (validationResult.error) {
      // Validation failed - could log or emit error
      console.warn('Attachment validation failed:', validationResult.error);
    }
  }

  /**
   * Downloads a file attachment using the common download utility
   */
  onDownloadFile(file: IFileItem): void {
    downloadFile({
      file,
      composeService: this.composeService,
      toastr: this.toastr,
      destroy$: this.destroy$,
      httpClient: this.httpClient,
    });
  }
}
