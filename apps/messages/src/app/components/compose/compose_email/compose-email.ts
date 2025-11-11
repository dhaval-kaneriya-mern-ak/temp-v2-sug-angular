import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  SugUiRadioCheckboxButtonComponent,
  RadioCheckboxChangeEvent,
  SugUiDialogComponent,
  SugUiButtonComponent,
  SugUiTooltipComponent,
  SugUiMultiSelectDropdownComponent,
  DialogConfig,
  SugUiTableComponent,
  SugUiLoadingSpinnerComponent,
  SugUiDatePickerComponent,
} from '@lumaverse/sug-ui';
import { ISugTableConfig, ISugTableColumn } from '@lumaverse/sug-ui';
import { ISelectOption } from '@lumaverse/sug-ui';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { ComposeService } from '../compose.service';
import {
  IGroupMember,
  ISignUpItem,
  ISubAdmin,
  IRecipient,
  IDateSlotsRequest,
} from '@services/interfaces/messages-interface/compose.interface';
import { ChipModule } from 'primeng/chip';
import { UserStateService } from '@services/user-state.service';
import { Subject, takeUntil } from 'rxjs';
import { MemberProfile } from '@services/interfaces';
import { InputTextModule } from 'primeng/inputtext';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'sug-compose-email',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SugUiRadioCheckboxButtonComponent,
    SugUiButtonComponent,
    SugUiTooltipComponent,
    ButtonModule,
    BadgeModule,
    SugUiMultiSelectDropdownComponent,
    ChipModule,
    SugUiDialogComponent,
    SugUiTableComponent,
    SugUiDatePickerComponent,
    SugUiLoadingSpinnerComponent,
    InputTextModule,
  ],
  providers: [],
  templateUrl: './compose-email.html',
  styleUrls: ['./compose-email.scss'],
})
export class ComposeEmailComponentMain implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  composeService = inject(ComposeService);
  private toastr = inject(ToastrService);
  userProfile!: MemberProfile | null;
  // Reactive Forms
  emailFormOne!: FormGroup; // For "Invite people to a sign up"
  emailFormTwo!: FormGroup; // For "Email people participating in a sign up"
  signUpDialogForm!: FormGroup; // For signup links dialog
  peopleDialogForm!: FormGroup; // For select people dialog
  peopleSendMessageDialogForm!: FormGroup; // For send message to people dialog
  selectedValues: string[] = [];
  selectedSignups: ISignUpItem[] = [];
  selectedGroups: ISelectOption[] = []; // Track selected groups with their data
  recipientCount = 0; // Track total recipient count
  minDate = new Date();
  token: string | undefined;
  // Dialog configuration for "Select Sign Ups" dialog
  signUpDialogConfig: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: false,
    dismissableMask: true,
    position: 'center',
    width: '480px',
    contentStyleClass: 'dialog-overflow-visible',
  };

  // Dialog configuration for "Select People" dialog
  peopleDialogConf: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '600px',
  };

  // Dialog configuration for "Select File" dialog
  selectFileDialogConf: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '500px',
  };

  // Dialog configuration for "Help" dialog
  helpDialogConf: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '850px',
  };

  // Dialog configuration for "Send Message to People" dialog
  peopleSendMessageDialogConf: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '600px',
  };

  // Dialog configuration for "From My Groups" dialog
  fromMyGroupsDialogConf: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '900px',
  };

  // Dialog configuration for "From This Sign Up" dialog
  fromThisSignUpDialogConf: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '800px',
  };

  // Dialog configuration for "Preview Email" dialog
  preViewEmailDialogConfig: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '850px',
  };
  recipientDialogConf: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '800px',
  };

  signUpModelShow = false;
  isPeopleDialogVisible = false;
  isSelectFileDialogVisible = false;
  isHelpDialogVisible = false;
  isPeopleSendMessageDialogVisible = false;
  isFromMyGroupsDialogVisible = false;
  isFromThisSignUpDialogVisible = false;
  isPreViewEmailDialogVisible = false;
  isRecipientDialogVisible = false;
  isLoading = false;

  cloudSpongeServicesData: string[] = [];
  // Options for the dialog select box when first radio option is selected
  signUpOptions: ISelectOption[] = [];

  defaultSignUpOption: ISelectOption = this.signUpOptions[0];

  showRadioButtons = true;
  recipientColumns: ISugTableColumn[] = [
    {
      field: 'displayname',
      header: 'Name',
      sortable: true,
      filterable: false,
    },
    {
      field: 'email',
      header: 'Email',
      sortable: true,
      filterable: false,
    },
  ];
  get dialogRadioOptions() {
    const baseOptions = [
      { label: 'Link to specific sign up(s)', value: 'LinkSpecificSignup' },
      {
        label: 'Link to my main account',
        value: 'LinkMainAccount',
        hasCustomContent: true,
      },
    ];

    // Only add tab groups option if we have tab groups data
    if (this.tabGroupsData && this.tabGroupsData.length > 0) {
      baseOptions.push({
        label: 'Link to specific tab group(s)',
        value: 'LinkSpecifixTabGroup',
        hasCustomContent: true,
      });
    }

    return baseOptions;
  }

  sendMessageRadioOptions = [
    {
      label: 'Members in the following group(s)',
      value: 'peopleingroups',
      hasCustomContent: true,
    },
    {
      label: 'Manually enter emails',
      value: 'ManuallyEnterEmail',
      hasCustomContent: true,
    },
    {
      label: 'Import emails from my provider',
      value: 'ImportEmailFromProvider',
      hasCustomContent: true,
    },
  ];
  nonGroupMemeberOption = [
    {
      label: 'Also include people that signed up but are not in the group(s)',
      value: 'includenongroup',
    },
  ];
  groupAliasCheckboxOption = [
    { label: 'I need to enter a group email alias', value: 'usegroupalias' },
  ];

  // RSVP response options for RSVP signups
  rsvpResponseOptions = [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
    { label: 'Maybe', value: 'maybe' },
    { label: 'No Response', value: 'noresponse' },
  ];

  get sendMessagePeopleRadioOptions() {
    // Check if selected signups contain any RSVP signup
    const hasRsvpSignup = this.selectedSignups.some(
      (signup) => signup.mode?.toLowerCase() === 'rsvp'
    );

    // If RSVP signup is selected, show RSVP-specific options
    if (hasRsvpSignup) {
      return [
        {
          label: 'People with specific RSVP response',
          value: 'specificRsvpResponse',
          hasCustomContent: true,
        },
        {
          label: 'People in specific group(s)',
          value: 'sendMessagePeopleRadio',
          hasCustomContent: true,
        },
        {
          label: 'People I will select',
          value: 'sendMessagePeopleIselect',
          hasCustomContent: true,
        },
      ];
    }

    if (
      this.signUpDialogForm.get('selectedSignupValue')?.value ===
      'LinkMainAccount'
    ) {
      return [
        {
          label: 'People in specific group(s)',
          value: 'sendMessagePeopleRadio',
          hasCustomContent: true,
        },
        {
          label: 'People I will select',
          value: 'sendMessagePeopleIselect',
          hasCustomContent: true,
        },
      ];
    }

    const allOptions = [
      {
        label: 'People who have signed up',
        value: 'peopleWhoSignedUp',
        hasCustomContent: true,
      },
      {
        label: 'People who have NOT signed up',
        value: 'peopleWhoNotSignedUp',
        hasCustomContent: true,
      },
      {
        label: 'People in specific group(s)',
        value: 'sendMessagePeopleRadio',
        hasCustomContent: true,
      },
      {
        label: 'People I will select',
        value: 'sendMessagePeopleIselect',
        hasCustomContent: true,
      },
    ];

    // If selectedTabGroups has a value, return only the last two options
    if (this.selectedTabGroups && this.selectedTabGroups.length > 0) {
      return allOptions.slice(2); // Return only last two options
    }

    return allOptions; // Return all options
  }

  // Options for peopleingroups
  sendMessageSelectOne: ISelectOption[] = [];
  recipient: (IGroupMember | IRecipient)[] = [];

  // Options for ManuallyEnterEmail
  sendMessageSelectTwo: ISelectOption[] = [];

  // Options for ImportEmailFromProvider
  sendMessageSelectThree = [
    {
      label: 'Import Group 1',
      value: 'importgroup1',
    },
    {
      label: 'Import Group 2',
      value: 'importgroup2',
    },
  ];

  // Options for selectFileDialog
  selectFileRadioOptions = [
    {
      label: 'Screenshot 2024-05-23 at 1.png',
      value: 'uploadcomputer',
    },
    {
      label: 'Screenshot 2024-05-23 at 1.png',
      value: 'geniusdrive',
    },
    {
      label: 'Screenshot 2024-05-23 at 1.png',
      value: 'cloudstorage',
    },
  ];

  radioOptions = [
    { label: 'Invite people to a sign up', value: 'emailoptionone' },
    {
      label: 'Email people participating in a sign up',
      value: 'emailoptiontwo',
    },
  ];

  selectedValue: string | null = null;
  includeNonGroupMembersForPeople = false;

  // SubAdmins data properties
  subAdminsData: ISelectOption[] = [];
  selectedSubAdmins: ISubAdmin[] = [];
  // Tab Groups data properties
  tabGroupsData: ISelectOption[] = [];
  selectedTabGroups: ISelectOption[] = [];
  // Sign Up Index Page selection
  isSignUpIndexPageSelected = false;

  // Dialog state for radio selection
  selectedSignupValue: string | null = null;
  protected readonly userStateService = inject(UserStateService);
  private readonly destroy$ = new Subject<void>();

  // Preview Email properties
  emailHtmlPreview = '';
  emailTextPreview = '';
  selectedThemeImage = '';
  availableThemes: ISelectOption[] = [];
  selectedThemeId: string | null = null;

  // Schedule Send properties
  showScheduleDropdown = false;
  scheduledDate: Date | null = null;
  scheduledTime: Date | null = null;

  // Dialog state for people send message radio selection
  peopleSendMessageSelectedValue: string | null = null;
  useGroupAlias = false;

  // Date Slots selection and filtering properties
  selectedDateSlots: Array<{
    slotitemid: number;
    starttime: string;
    item: string;
    location: string;
    qtytaken: number;
    qtyremaining: number;
    signedupmembers: string;
  }> = [];

  // Date slots filters
  filterAvailableOnly = false;
  filterDateFrom: Date | null = null;
  filterDateTo: Date | null = null;
  filterItem = '';
  filterLocation = '';
  currentSortBy = 'starttime,item';

  ngOnInit() {
    this.initializeForms();
    this.getSignUpList();
    this.getGroupforMembers();
    this.loadUserProfileData();
    this.getSubAdmins();
  }

  private loadUserProfileData(): void {
    // Simplified: Just subscribe to profile changes and update plan name
    this.userStateService.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.userProfile = profile
            ? this.userStateService.getCurrentProfile()
            : null;

          // Update form with user's full name when profile is loaded
          if (this.userProfile) {
            const fullName = `${this.userProfile.firstname || ''} ${
              this.userProfile.lastname || ''
            }`.trim();

            // Update both forms if they exist
            if (this.emailFormOne) {
              this.emailFormOne.patchValue({ fromName: fullName });
            }
            if (this.emailFormTwo) {
              this.emailFormTwo.patchValue({ fromName: fullName });
            }
            if (this.userProfile?.features.signuptabbing) {
              this.getTabGroups();
            }
          }
        },
        error: () => {
          // this.planName = 'Free';
        },
      });
  }

  /**
   * Initialize all reactive forms
   */
  private initializeForms() {
    // Form for "Invite people to a sign up" (emailoptionone)
    this.emailFormOne = this.fb.group({
      token: ['', Validators.required],
      selectedSignups: [[], Validators.required],
      fromName: ['', Validators.required], // User's full name (firstname + lastname)
      replyTo: [{ value: [], disabled: true }], // Disabled by default
      toPeople: [{ value: [], disabled: true }, Validators.required], // Disabled until signup selected
      subject: [{ value: '', disabled: true }, Validators.required], // Disabled until signup selected
      message: [{ value: '', disabled: true }, Validators.required], // Disabled until signup selected
      attachments: [],
    });

    // Form for "Email people participating in a sign up" (emailoptiontwo)
    this.emailFormTwo = this.fb.group({
      token: ['', Validators.required],
      selectedSignups: [[], Validators.required],
      fromName: ['', Validators.required], // User's full name (firstname + lastname)
      replyTo: [{ value: [], disabled: true }], // Disabled by default
      toPeople: [{ value: [], disabled: true }, Validators.required], // Disabled until signup selected
      subject: [{ value: '', disabled: true }, Validators.required], // Disabled until signup selected
      message: [{ value: '', disabled: true }, Validators.required], // Disabled until signup selected
      attachments: [],
    });

    // Dialog form for signup links selection
    this.signUpDialogForm = this.fb.group({
      selectedSignupValue: [null],
      selectedSignups: [],
      selectedTabGroups: [],
    });

    // People dialog form
    this.peopleDialogForm = this.fb.group({
      peopleSendMessageSelectedValue: [null, Validators.required],
      selectedGroups: [],
      includeNonGroupMembers: [],
      manualEmails: [''],
      manualEmailsGroup: [],
      useGroupAlias: [],
      groupEmailAlias: ['', Validators.email],
    });

    // People send message dialog form
    this.peopleSendMessageDialogForm = this.fb.group({
      peopleSendMessageSelectedValue: [null, Validators.required],
      selectedGroups: [],
      includeNonGroupMembersForPeople: [],
      // Individual checkboxes for RSVP responses
      rsvpResponseyes: [false],
      rsvpResponseno: [false],
      rsvpResponsemaybe: [false],
      rsvpResponsenoresponse: [false],
    });
  }

  // Methods for "Select Sign Ups" dialog
  openSignUpsDialog() {
    // Pre-fill the form with currently selected signups
    if (this.selectedSignups.length > 0) {
      // Convert SignUpItem objects back to JSON strings for the multi-select
      const signupValues = this.selectedSignups.map((item) =>
        JSON.stringify(item)
      );

      this.signUpDialogForm.patchValue({
        selectedSignupValue: 'LinkSpecificSignup',
        selectedSignups: signupValues,
      });

      this.selectedSignupValue = 'LinkSpecificSignup';

      // Update group options state based on current selection
      this.updateGroupOptionsState(signupValues);
    } else if (this.selectedTabGroups.length > 0) {
      // Pre-fill with selected tab groups
      const tabGroupValues = this.selectedTabGroups.map((group) => group.value);
      this.signUpDialogForm.patchValue({
        selectedSignupValue: 'LinkSpecifixTabGroup',
        selectedTabGroups: tabGroupValues,
      });
      this.selectedSignupValue = 'LinkSpecifixTabGroup';
    } else if (this.isSignUpIndexPageSelected) {
      // Pre-fill with Sign Up Index Page selection
      this.signUpDialogForm.patchValue({
        selectedSignupValue: 'LinkMainAccount',
        selectedSignups: [],
        selectedTabGroups: [],
      });
      this.selectedSignupValue = 'LinkMainAccount';
    } else {
      this.selectedSignupValue = null;
      this.signUpDialogForm.reset();
      // Reset all options to enabled state
      this.updateGroupOptionsState([]);
    }

    this.signUpModelShow = true;
  }

  onSignUpSelectionChange(event: { value: string[] }) {
    // Only update the dialog form, don't update selectedSignups yet
    // selectedSignups will be updated when user clicks "Okay"
    this.signUpDialogForm.patchValue({ selectedSignups: event.value });

    // Disable second group options if first group option is selected
    this.updateGroupOptionsState(event.value);
  }

  updateGroupOptionsState(selectedValues: string[]) {
    if (!selectedValues || selectedValues.length === 0) {
      // No selection - enable all options
      this.signUpOptions = this.signUpOptions.map((group) => ({
        ...group,
        items: group.items?.map((item) => ({ ...item, disabled: false })),
      }));
      return;
    }

    // Determine which group(s) have selected items
    const firstGroupHasSelection = selectedValues.some((val) => {
      try {
        const parsed = JSON.parse(val);
        return parsed.mode?.toLowerCase() === 'rsvp';
      } catch {
        return false;
      }
    });

    const secondGroupHasSelection = selectedValues.some((val) => {
      try {
        const parsed = JSON.parse(val);
        return parsed.mode?.toLowerCase() === 'standard';
      } catch {
        return false;
      }
    });

    // Update options based on selection
    this.signUpOptions = this.signUpOptions.map((group) => {
      if (group.value === 'rsvp-group') {
        // First group (RSVP) - disable if second group has selection
        return {
          ...group,
          items: group.items?.map((item) => ({
            ...item,
            disabled: secondGroupHasSelection,
          })),
        };
      } else if (group.value === 'standard-group') {
        // Second group (Standard) - disable if first group has selection
        return {
          ...group,
          items: group.items?.map((item) => ({
            ...item,
            disabled: firstGroupHasSelection,
          })),
        };
      }
      return group;
    });
  }

  onTabGroupSelectionChange(event: { value: string[] }) {
    // Only update the dialog form, don't update selectedTabGroups yet
    // selectedTabGroups will be updated when user clicks "Okay"
    this.signUpDialogForm.patchValue({ selectedTabGroups: event.value });
  }

  closeSignupDialog(close: boolean) {
    if (!close) {
      // User clicked "Okay" - save the selection
      const dialogFormValues = this.signUpDialogForm.value;

      // Check which radio button is selected to determine what to save
      if (dialogFormValues.selectedSignupValue === 'LinkSpecificSignup') {
        // Handle selectedSignups (Sign Up Link(s) selection)
        if (
          dialogFormValues.selectedSignups &&
          dialogFormValues.selectedSignups.length > 0
        ) {
          // Update selectedSignups from the dialog form
          this.selectedSignups = dialogFormValues.selectedSignups.map(
            (item: string) => JSON.parse(item)
          );

          // Clear tab groups and index page flag since user selected signups
          this.selectedTabGroups = [];
          this.isSignUpIndexPageSelected = false;

          // Update the main form
          const currentForm =
            this.selectedValue === 'emailoptionone'
              ? this.emailFormOne
              : this.emailFormTwo;
          currentForm.patchValue({ selectedSignups: this.selectedSignups });

          // Update subject and message based on selected signups
          this.updateSubjectAndMessage();

          // Toggle Reply To control based on selection
          this.toggleReplyToControl();

          this.signUpModelShow = false;
        } else {
          this.toastr.error('Please select at least one sign up', 'Error');
        }
      } else if (
        dialogFormValues.selectedSignupValue === 'LinkSpecifixTabGroup'
      ) {
        // Handle selectedTabGroups (Tab Groups selection)
        if (
          dialogFormValues.selectedTabGroups &&
          dialogFormValues.selectedTabGroups.length > 0
        ) {
          // Update selectedTabGroups from the dialog form (convert values to ISelectOption objects)
          this.selectedTabGroups = this.tabGroupsData.filter((group) =>
            dialogFormValues.selectedTabGroups.includes(group.value)
          );

          // Clear signups and index page flag since user selected tab groups
          this.selectedSignups = [];
          this.isSignUpIndexPageSelected = false;

          // Clear subject and message fields since tab groups don't auto-populate these
          const currentForm =
            this.selectedValue === 'emailoptionone'
              ? this.emailFormOne
              : this.emailFormTwo;
          currentForm.patchValue({
            subject: '',
            message: '',
          });

          this.signUpModelShow = false;
        } else {
          this.toastr.error('Please select at least one tab group', 'Error');
        }
      } else if (dialogFormValues.selectedSignupValue === 'LinkMainAccount') {
        // Handle "Link to my main account" option
        // Clear both signups and tab groups
        this.selectedSignups = [];
        this.selectedTabGroups = [];

        // Set the Sign Up Index Page flag
        this.isSignUpIndexPageSelected = true;

        // Set subject and message for Sign Up Index Page
        const currentForm =
          this.selectedValue === 'emailoptionone'
            ? this.emailFormOne
            : this.emailFormTwo;

        currentForm.patchValue({
          subject: 'Sign Up Invite',
        });

        // Enable form controls
        this.toggleReplyToControl();

        this.signUpModelShow = false;
      } else {
        // No valid selection made
        this.toastr.error('Please select an option', 'Error');
      }
    } else {
      // User clicked X or cancel - reset to previous state
      this.signUpModelShow = false;

      // Reset the dialog form to the currently selected values
      // Note: Only one can be active at a time (signups OR tab groups OR index page)
      if (this.selectedSignups.length > 0) {
        const signupValues = this.selectedSignups.map((item) =>
          JSON.stringify(item)
        );
        this.signUpDialogForm.patchValue({
          selectedSignupValue: 'LinkSpecificSignup',
          selectedSignups: signupValues,
          selectedTabGroups: [], // Clear tab groups
        });
      } else if (this.selectedTabGroups.length > 0) {
        const tabGroupValues = this.selectedTabGroups.map(
          (group) => group.value
        );
        this.signUpDialogForm.patchValue({
          selectedSignupValue: 'LinkSpecifixTabGroup',
          selectedTabGroups: tabGroupValues,
          selectedSignups: [], // Clear signups
        });
      } else if (this.isSignUpIndexPageSelected) {
        this.signUpDialogForm.patchValue({
          selectedSignupValue: 'LinkMainAccount',
          selectedSignups: [],
          selectedTabGroups: [],
        });
      } else {
        this.signUpDialogForm.reset();
      }
    }
  }

  /**
   * Update subject and message based on selected signups
   */
  private updateSubjectAndMessage(): void {
    if (!this.userProfile || this.selectedSignups.length === 0) {
      return;
    }

    const userFullName = `${this.userProfile.firstname || ''} ${
      this.userProfile.lastname || ''
    }`.trim();
    const currentForm =
      this.selectedValue === 'emailoptionone'
        ? this.emailFormOne
        : this.emailFormTwo;

    if (this.selectedSignups.length === 1) {
      // Single signup selected
      const signup = this.selectedSignups[0];
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

      currentForm.patchValue({
        subject: subject,
        message: message,
      });
    } else {
      // Multiple signups selected - DO NOT include passcode info
      const subject = 'Sign Up Invite';
      const message = `You have been invited by ${userFullName} to sign up for one or more events.`;

      currentForm.patchValue({
        subject: subject,
        message: message,
      });
    }
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

  /**
   * Toggle form controls based on signup selection
   * Enables/disables Reply To, To, Subject, and Message fields
   */
  private toggleReplyToControl(): void {
    const shouldEnable =
      this.selectedSignups.length > 0 ||
      this.selectedTabGroups.length > 0 ||
      this.isSignUpIndexPageSelected;

    if (shouldEnable) {
      // Enable specific controls when signups, tab groups, or index page are selected
      this.emailFormOne.get('replyTo')?.enable();
      this.emailFormOne.get('toPeople')?.enable();
      this.emailFormOne.get('subject')?.enable();
      this.emailFormOne.get('message')?.enable();

      this.emailFormTwo.get('replyTo')?.enable();
      this.emailFormTwo.get('toPeople')?.enable();
      this.emailFormTwo.get('subject')?.enable();
      this.emailFormTwo.get('message')?.enable();
    } else {
      // Disable specific controls when no selections are made
      this.emailFormOne.get('replyTo')?.disable();
      this.emailFormOne.get('toPeople')?.disable();
      this.emailFormOne.get('subject')?.disable();
      this.emailFormOne.get('message')?.disable();

      this.emailFormTwo.get('replyTo')?.disable();
      this.emailFormTwo.get('toPeople')?.disable();
      this.emailFormTwo.get('subject')?.disable();
      this.emailFormTwo.get('message')?.disable();
    }
  }

  // Methods for "Select People" dialog
  openPeopleDialog() {
    this.isPeopleDialogVisible = true;
  }

  /**
   * Unified method to close people selection dialogs
   * @param dialogType - 'people' or 'peopleSendMessage'
   * @param close - true if user clicked X (cancel), false if clicked OK (save)
   */
  private closePersonSelectionDialog(
    dialogType: 'people' | 'peopleSendMessage',
    close: boolean
  ) {
    const dialogForm =
      dialogType === 'people'
        ? this.peopleDialogForm
        : this.peopleSendMessageDialogForm;
    const dialogVisibleFlag =
      dialogType === 'people'
        ? 'isPeopleDialogVisible'
        : 'isPeopleSendMessageDialogVisible';

    if (!close) {
      const selectedOption = dialogForm.get(
        'peopleSendMessageSelectedValue'
      )?.value;

      // Validate based on the selected option
      let isValid = false;
      let validationMessage = '';

      if (selectedOption === 'ManuallyEnterEmail') {
        const manualEmails = dialogForm.get('manualEmails')?.value || '';
        const groupEmailAlias = dialogForm.get('groupEmailAlias')?.value || '';

        // Parse emails from the manual entry textarea
        const emailList = manualEmails
          .split(/[,\n]/)
          .map((email: string) => email.trim())
          .filter((email: string) => email.length > 0);

        // Add group email alias if provided
        if (groupEmailAlias.trim().length > 0) {
          emailList.push(groupEmailAlias.trim());
        }

        if (emailList.length === 0) {
          validationMessage = 'Please enter at least one email address';
        } else {
          // Validate each email format
          const invalidEmails = emailList.filter(
            (email: string) => !this.userStateService.isValidEmail(email)
          );

          if (invalidEmails.length > 0) {
            validationMessage = `The following email(s) are invalid:\n${invalidEmails.join(
              ', '
            )}`;
          } else {
            isValid = true;
            this.recipientCount = emailList.length;
            this.selectedGroups = [
              {
                label: 'Manual entry',
                value: 'manual_entry',
              },
            ];

            // Store the emails for later use
            this.recipient = emailList.map((email: string) => ({ email }));
          }
        }
      } else if (selectedOption === 'specificRsvpResponse') {
        // Handle RSVP response selection
        const selectedResponses = this.getSelectedRsvpResponses();

        if (selectedResponses.length === 0) {
          validationMessage = 'Please select at least one RSVP response';
        } else {
          isValid = true;
          this.getGroupMembers();
          this.selectedGroups = [
            {
              label: 'Specific RSVP Responses',
              value: 'specificRsvpResponse',
            },
          ];
        }
      } else if (selectedOption === 'peopleWhoSignedUp') {
        // People who have signed up
        isValid = true;
        this.getGroupMembers();
        this.selectedGroups = [
          {
            label: 'People who have signed up',
            value: 'peopleWhoSignedUp',
          },
        ];
      } else if (selectedOption === 'peopleWhoNotSignedUp') {
        // People who have NOT signed up
        const selectedGroupIds = dialogForm.get('selectedGroups')?.value || [];

        if (selectedGroupIds.length > 0) {
          isValid = true;
          this.getGroupMembers();
          this.selectedGroups = this.sendMessageSelectOne.filter((group) =>
            selectedGroupIds.includes(group.value)
          );
        } else {
          validationMessage = 'Please select at least one group';
        }
      } else if (selectedOption === 'sendMessagePeopleRadio') {
        // People in specific group(s)
        const selectedGroupIds = dialogForm.get('selectedGroups')?.value || [];

        if (selectedGroupIds.length > 0) {
          isValid = true;
          this.getGroupMembers();
          this.selectedGroups = this.sendMessageSelectOne.filter((group) =>
            selectedGroupIds.includes(group.value)
          );
        } else {
          validationMessage = 'Please select at least one group';
        }
      } else if (selectedOption === 'sendMessagePeopleIselect') {
        // People I will select - custom selection
        isValid = true;
        this.selectedGroups = [
          {
            label: 'Custom selected people',
            value: 'sendMessagePeopleIselect',
          },
        ];
        // Note: Recipients will be set from the custom selection dialogs
      } else if (selectedOption === 'peopleingroups') {
        // Handle group selection (legacy support)
        const selectedGroupIds = dialogForm.get('selectedGroups')?.value || [];

        if (selectedGroupIds.length > 0) {
          isValid = true;
          this.getGroupMembers();
          this.selectedGroups = this.sendMessageSelectOne.filter((group) =>
            selectedGroupIds.includes(group.value)
          );
        } else {
          validationMessage = 'Please select at least one group';
        }
      } else if (selectedOption) {
        // For other options like import from provider
        isValid = true;
      } else {
        validationMessage = 'Please select a recipient option';
      }

      if (isValid) {
        // Update the active email form with selected people
        const currentForm =
          this.selectedValue === 'emailoptionone'
            ? this.emailFormOne
            : this.emailFormTwo;
        currentForm.patchValue({
          toPeople:
            selectedOption === 'ManuallyEnterEmail'
              ? 'manual'
              : dialogForm.get('selectedGroups')?.value,
        });

        this[dialogVisibleFlag] = false;
      } else {
        this.toastr.error(validationMessage, 'Error');
      }
    } else {
      // User clicked X - close without saving changes
      // Reset the dialog form to previously saved selections
      this[dialogVisibleFlag] = false;

      // Restore the form to the currently selected groups (don't clear them)
      if (this.selectedGroups.length > 0) {
        const selectedGroupIds = this.selectedGroups.map(
          (group) => group.value
        );
        dialogForm.patchValue({
          selectedGroups: selectedGroupIds,
        });
      } else {
        // Only reset if there were no previous selections
        this.selectedValues = [];
        if (dialogType === 'people') {
          dialogForm.reset({
            peopleSendMessageSelectedValue: null,
            selectedGroups: [],
            includeNonGroupMembers: false,
            manualEmails: '',
            manualEmailsGroup: [],
            useGroupAlias: false,
          });
        } else {
          dialogForm.reset({
            peopleSendMessageSelectedValue: null,
            selectedGroups: [],
            includeNonGroupMembersForPeople: false,
            rsvpResponseyes: false,
            rsvpResponseno: false,
            rsvpResponsemaybe: false,
            rsvpResponsenoresponse: false,
          });
        }
      }
    }
  }

  // Handle radio button change to reset form controls
  onPeopleSendMessageRadioChange(event: { value: string }) {
    // Reset peopleDialogForm controls
    this.peopleDialogForm.patchValue({
      selectedGroups: [],
      includeNonGroupMembers: false,
      manualEmails: '',
      manualEmailsGroup: [],
      useGroupAlias: false,
      groupEmailAlias: '',
    });

    // Reset peopleSendMessageDialogForm controls
    this.peopleSendMessageDialogForm.patchValue({
      selectedGroups: [],
      includeNonGroupMembersForPeople: false,
      rsvpResponseyes: false,
      rsvpResponseno: false,
      rsvpResponsemaybe: false,
      rsvpResponsenoresponse: false,
    });

    // Clear any selected values
    this.selectedValues = [];
    this.selectedGroups = [];
    this.recipientCount = 0;
  }

  showRecipientDetails() {
    this.isRecipientDialogVisible = true;
    // Open dialog or modal to show recipient details
    // For now, we can open the people dialog
    // this.openPeopleDialog();
  }

  // Methods for "Select File" dialog
  openSelectFileDialog() {
    this.isSelectFileDialogVisible = true;
  }

  closeSelectFileDialog() {
    this.isSelectFileDialogVisible = false;
  }

  // Methods for "Help" dialog
  openHelpDialog() {
    this.isHelpDialogVisible = true;
  }

  closeHelpDialog() {
    this.isHelpDialogVisible = false;
  }

  // Methods for "Send Message to People" dialog
  openPeopleSendMessageDialog() {
    this.isPeopleSendMessageDialogVisible = true;
  }

  closePeopleSendMessageDialog(close = false) {
    this.closePersonSelectionDialog('peopleSendMessage', close);
  }

  /**
   * Get selected RSVP responses as an array
   * @returns Array of selected RSVP response values
   */
  getSelectedRsvpResponses(): string[] {
    const responses: string[] = [];
    const form = this.peopleSendMessageDialogForm;

    if (form.get('rsvpResponseyes')?.value) responses.push('yes');
    if (form.get('rsvpResponseno')?.value) responses.push('no');
    if (form.get('rsvpResponsemaybe')?.value) responses.push('maybe');
    if (form.get('rsvpResponsenoresponse')?.value) responses.push('nr');

    return responses;
  }

  // Methods for "From My Groups" dialog
  openFromMyGroupsDialog() {
    this.isFromMyGroupsDialogVisible = true;
  }

  closeFromMyGroupsDialog() {
    this.isFromMyGroupsDialogVisible = false;
  }

  // Methods for "From This Sign Up" dialog
  openFromThisSignUpDialog() {
    this.isFromThisSignUpDialogVisible = true;
    this.loadDateSlots();
  }

  closeFromThisSignUpDialog() {
    this.isFromThisSignUpDialogVisible = false;
  }

  /**
   * Load date slots for selected signups with filtering support
   */
  loadDateSlots() {
    if (this.selectedSignups.length === 0) {
      this.toastr.error('Please select a signup first', 'Error');
      return;
    }

    // For simplicity, load slots for the first selected signup
    // You can modify this to handle multiple signups if needed
    const signupId = parseInt(
      this.selectedSignups[0].signupid?.toString() || '0',
      10
    );

    if (!signupId) {
      this.toastr.error('Invalid signup ID', 'Error');
      return;
    }

    this.dateSlotsLoading = true;
    const payload: IDateSlotsRequest = {
      includeSignedUpMembers: true,
      pagination: {
        page: this.dateSlotsPage,
        limit: this.dateSlotsLimit,
        sortby: this.currentSortBy,
      },
      // Add date range filters if set
      ...(this.filterDateFrom && {
        startDate: this.filterDateFrom.toISOString().split('T')[0],
      }),
      ...(this.filterDateTo && {
        endDate: this.filterDateTo.toISOString().split('T')[0],
      }),
    };

    this.composeService
      .getDateSlots(signupId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.dateSlots = response.data;

            // Apply client-side filters
            let filteredData = response.data;

            // Filter by availability
            if (this.filterAvailableOnly) {
              filteredData = filteredData.filter(
                (slot) => slot.qtyremaining > 0
              );
            }

            // Filter by item name
            if (this.filterItem.trim()) {
              const itemLower = this.filterItem.toLowerCase();
              filteredData = filteredData.filter((slot) =>
                slot.item.toLowerCase().includes(itemLower)
              );
            }

            // Filter by location
            if (this.filterLocation.trim()) {
              const locationLower = this.filterLocation.toLowerCase();
              filteredData = filteredData.filter((slot) =>
                (slot.location || '').toLowerCase().includes(locationLower)
              );
            }

            // Transform data for table display
            this.tableSignUpData = filteredData.map((slot) => ({
              slotitemid: slot.slotitemid,
              starttime: this.formatDateTime(slot.starttime, slot.usetime),
              item: slot.item,
              location: slot.location || 'N/A',
              qtytaken: slot.qtytaken,
              qtyremaining: slot.qtyremaining,
              signedupmembers: slot.signedupmembers || '',
            }));

            // Update pagination
            if (response.pagination) {
              this.dateSlotsTotalPages = response.pagination.totalPages;
            }
          } else {
            this.dateSlots = [];
            this.tableSignUpData = [];
          }
          this.dateSlotsLoading = false;
        },
        error: (err) => {
          this.dateSlots = [];
          this.tableSignUpData = [];
          this.dateSlotsLoading = false;
        },
      });
  }

  /**
   * Format date/time for display
   */
  formatDateTime(dateTime: string, useTime: boolean): string {
    if (!dateTime) return 'N/A';

    const date = new Date(dateTime);
    const dateStr = date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });

    if (useTime) {
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${dateStr} ${timeStr}`;
    }

    return dateStr;
  }

  /**
   * Handle pagination for date slots
   */
  onDateSlotsPageChange(event: { page: number }) {
    this.dateSlotsPage = event.page + 1; // PrimeNG uses 0-based index
    this.loadDateSlots();
  }

  /**
   * Apply filters and reload date slots
   */
  applyDateSlotFilters() {
    this.dateSlotsPage = 1; // Reset to first page
    this.loadDateSlots();
  }

  /**
   * Clear all filters and reload
   */
  clearDateSlotFilters() {
    this.filterAvailableOnly = false;
    this.filterDateFrom = null;
    this.filterDateTo = null;
    this.filterItem = '';
    this.filterLocation = '';
    this.dateSlotsPage = 1;
    this.loadDateSlots();
  }

  /**
   * Handle row selection in date slots table
   */
  onDateSlotSelectionChange(event: {
    value: Array<{
      starttime: string;
      item: string;
      location: string;
      qtytaken: number;
      qtyremaining: number;
      signedupmembers: string;
      slotitemid: number;
    }>;
  }) {
    this.selectedDateSlots = event.value || [];
  }

  /**
   * Select all visible slots
   */
  selectAllDateSlots() {
    this.selectedDateSlots = [...this.tableSignUpData];
  }

  /**
   * Clear all slot selections
   */
  clearAllDateSlots() {
    this.selectedDateSlots = [];
  }

  /**
   * Close From This Sign Up dialog and process selected slots
   */
  closeFromThisSignUpDialogWithSelection(close: boolean) {
    if (!close) {
      // User clicked OK - process selected slots
      if (this.selectedDateSlots.length === 0) {
        this.toastr.error('Please select at least one slot', 'Error');
        return;
      }

      // Extract unique signed up members from selected slots
      const uniqueEmails = new Set<string>();
      const recipients: Array<IGroupMember | IRecipient> = [];

      this.selectedDateSlots.forEach((slot) => {
        if (slot.signedupmembers) {
          // Parse signed up members (assuming comma-separated email format)
          const members = slot.signedupmembers
            .split(',')
            .map((m) => m.trim())
            .filter((m) => m.length > 0);

          members.forEach((memberEmail) => {
            if (!uniqueEmails.has(memberEmail)) {
              uniqueEmails.add(memberEmail);
              // Create recipient object matching IRecipient interface
              recipients.push({
                memberid: 0,
                email: memberEmail,
                mobile: '',
                displayname: memberEmail,
                smsoptin: false,
              } as IRecipient);
            }
          });
        }
      });

      if (recipients.length === 0) {
        this.toastr.error(
          'No signed up members found in selected slots',
          'Error'
        );
        return;
      }

      // Set recipients and update UI
      this.recipient = recipients;
      this.recipientCount = recipients.length;

      // Close the slots dialog
      this.isFromThisSignUpDialogVisible = false;

      // Open the "Send this message to..." dialog with "People I will select" pre-selected
      this.peopleSendMessageDialogForm.patchValue({
        peopleSendMessageSelectedValue: 'sendMessagePeopleIselect',
      });
      this.peopleSendMessageSelectedValue = 'sendMessagePeopleIselect';

      // Store selected slots for display as chips
      this.selectedGroups = [
        {
          label: 'Selected Slots',
          value: 'custom_date_slots',
        },
      ];

      // Open the dialog
      this.isPeopleSendMessageDialogVisible = true;
    } else {
      // User clicked X - just close without saving
      this.isFromThisSignUpDialogVisible = false;
      this.selectedDateSlots = [];
    }
  }

  /**
   * Remove a selected slot chip
   */
  removeSelectedSlot(index: number) {
    if (index >= 0 && index < this.selectedDateSlots.length) {
      this.selectedDateSlots.splice(index, 1);

      // Recalculate recipients
      if (this.selectedDateSlots.length === 0) {
        this.recipient = [];
        this.recipientCount = 0;
      } else {
        // Recalculate recipients from remaining slots
        const uniqueEmails = new Set<string>();
        const recipients: Array<IGroupMember | IRecipient> = [];

        this.selectedDateSlots.forEach((slot) => {
          if (slot.signedupmembers) {
            const members = slot.signedupmembers
              .split(',')
              .map((m) => m.trim())
              .filter((m) => m.length > 0);

            members.forEach((memberEmail) => {
              if (!uniqueEmails.has(memberEmail)) {
                uniqueEmails.add(memberEmail);
                recipients.push({
                  memberid: 0,
                  email: memberEmail,
                  mobile: '',
                  displayname: memberEmail,
                  smsoptin: false,
                } as IRecipient);
              }
            });
          }
        });

        this.recipient = recipients;
        this.recipientCount = recipients.length;
      }
    }
  }

  /**
   * Open the "From This Sign Up" dialog to edit selected slots
   */
  editSelectedSlots() {
    this.isFromThisSignUpDialogVisible = true;
  }

  // Methods for "From This Sign Up" dialog
  openPreViewEmailDialog() {
    this.isPreViewEmailDialogVisible = true;
  }

  closePreViewEmailDialog() {
    this.isPreViewEmailDialogVisible = false;
  }

  /**
   * Send email immediately
   */
  sendEmailNow() {
    // TODO: Implement actual email sending logic
    this.closePreViewEmailDialog();
  }

  /**
   * Validate if scheduled date and time are both greater than current date/time
   * Returns true if valid (both date and time are in the future), false otherwise
   */
  isScheduledDateValid(): boolean {
    // Both scheduledDate and scheduledTime must be selected
    if (!this.scheduledDate || !this.scheduledTime) {
      return false;
    }

    const currentDate = new Date();

    // Combine the date from scheduledDate with the time from scheduledTime
    const combinedDateTime = new Date(this.scheduledDate);
    const timeValue = new Date(this.scheduledTime);

    // Set the hours and minutes from scheduledTime to the combined date
    combinedDateTime.setHours(timeValue.getHours());
    combinedDateTime.setMinutes(timeValue.getMinutes());
    combinedDateTime.setSeconds(0);
    combinedDateTime.setMilliseconds(0);

    // Check if the combined date/time is greater than current date/time
    return combinedDateTime > currentDate;
  }

  /**
   * Load preview data (HTML preview, theme, image) from API or mock data
   * In production, this would call an API to get the preview data
   */
  loadPreviewData() {
    // TODO: Replace with actual API call
    // For now, using the provided mock data structure
    const mockPreviewData = {
      TEXTPREVIEW:
        "Hello!<br /><br />aly gold wanted to send you the following message regarding the sign up &#34;event for qa (EST)&#34;: <br /><br />To view the sign up, go to:<br />event for qa (EST) : https://www.signupgenius.com/go//@z@z <br /><br /><br /> ----------------------------------------------------<br />1213 W. Morehead Street, Suite 500, Charlotte, NC 28208<br>&copy; 2025 SignUpGenius. All Rights Reserved. <br /> | <a href='https://www.signupgenius.com/privacy' style='color:#bbbbbb;' target='_blank'>Privacy Policy</a> | <a href='' style='color:#bbbbbb;' target='_blank'>Unsubscribe</a>",
      HTMLPREVIEW: `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html xmlns="http://www.w3.org/1999/xhtml">
   <head>
      <meta name="generator" content="SignUpGenius">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width">
      <meta name="x-apple-disable-message-reformatting">
      <style type="text/css" id="signupgenius-theme-styles">.appleLinksGray2 a {color: #aaaaaa !important;text-decoration: none;}.appleLinksOrange a {font-weight: bold !important;color: #f68b1c !important;text-decoration: none;}.outer {min-width: 710px;max-width: 710px;width: 710px;margin: 0 auto;background-color: #fff9ec;}.inner {min-width: 640px;max-width: 640px;width: 640px;}@media only screen and (max-device-width: 667px),only screen and (max-device-width: 640px),only screen and (max-device-width: 568px),only screen and (max-width: 480px) {html {font-size: 13pt}}.html-content {-webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale;padding: 0;text-align: left;background-color: #fff9ec;font-size: 12pt;}.email-template a {cursor: pointer;}.white-background {background-color: #fff;}.white-color {color: #fff;}.fall-background {background-color: #fff9ec;}.tan-background {background-color: #fefae0;}.green-background {background-color: #acc034;}.orange-color {color: #f68b1c;}.gray-color {color: #737474;}.gray2-color {color: #aaa;}.black-color {color: #000;}.green-button-border {border: 10px solid #acc034;}.orange-button-border {border: 17px solid #f68b1c;}.group-organizing-text {font-family: helvetica, arial, sans-serif;text-align: right;font-weight: 700;position: relative;top: 2px;font-size: 1em;line-height: 1em;vertical-align: middle;}.about-ad-text {font-size: 12px;font-weight: 400;font-family: helvetica, arial, sans-serif;text-align: center;text-decoration: none;}.footer {font-size: 12px;text-align: center;font-family: helvetica, arial, sans-serif;}.suglinks {font-size: 12px;text-align: center;font-family: arial, sans-serif;}.snippet-text {font-size: 18px;font-family: helvetica, arial, sans-serif;text-align: center;}.message-text {font-size: 18px;text-align: left;font-family: helvetica, arial, sans-serif;line-height: 27px;}.message-font {font-family: helvetica, arial, sans-serif;}.snippet-button-outer {text-align: left;font-family: helvetica, arial, sans-serif;font-weight: 700;}.snippet-button-inner {text-align: center;font-size: 18px;}.border-radius-normal {border-radius: 6px;}.signup-button {border-radius: 6px;text-align: center;font-weight: 700;font-family: helvetica, arial, sans-serif;font-size: 1.3em;text-decoration: none;width: 100%;height: 100%;}.color-text1 {color: #002F8E;line-height: 36px;}.button-background {background-color: #f68b1c;line-height: 60px;width: 100%;height: 100%;}.button-border {border: 1px solid #fb880c;}.width-35 {min-width: 35px;max-width: 35px;width: 35px;}.height-15 {min-height: 15px;max-height: 15px;height: 15px;line-height: 1px;font-size: 1px;}.overflow-hidden {overflow: hidden;}.height-4 {font-size: 1px;line-height: 1px;height: 4px;}.text-decoration-none {text-decoration: none;}.box-shadow {box-shadow: 0 5px 90px #fbd3a4;}.display-block {display: block;}.left-mini-ad {line-height: 1px;font-size: 1px;text-align: left;width: 50%;}.right-mini-ad {line-height: 1px;font-size: 1px;text-align: right;width: 50%;}.track-image {display: block;height: 1px;line-height: 1px;font-size: 1px;}.sign-up-button {width: 100%;height: 100%;border-radius: 6px;text-align: center;font-family: helvetica, arial, sans-serif;font-size: 1.3em;text-decoration: none;display: block;line-height: 60px;font-weight: 700;}.button-text-color {color: #FFF;}.mso-2016 {border: 16px solid #f68b1c;}.g-mail {height: 1px;white-space: nowrap;font: 15px courier;text-align: center;border: 0 solid transparent;width: 601px;min-width: 601px;color: #fff9ec;margin: 0 auto;}.width-640 {max-width: 640px;width: 640px;}.fixed-layout {table-layout: fixed;}.orange-background,.orange-background-only,.button-color {background-color: #f68b1c;}.signupgenius-button,.align-center,.ad1,.ad2 {text-align: center;}</style>
   </head>
   <body style="-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;padding:0;text-align:left;background-color:#fff9ec;">
      <div class="html-content">
         <table bgcolor="fff9ec" class="outer" cellpadding="0" cellspacing="0" border="0" align="center" style="min-width:710px;max-width:710px;width:710px;margin:0 auto;background-color:#fff9ec;">
         <tr>
            <td class="width-35" style="min-width:35px;max-width:35px;width:35px;"> </td>
            <td>
               <table class="inner" cellpadding="0" cellspacing="0" border="0" style="min-width:640px;max-width:640px;width:640px;">
                  <tr>
                     <td>
                        <!--Clear Space-->
                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                           <tr>
                              <td width="100%" height="35"> </td>
                           </tr>
                        </table>
                        <!-- Body --><table cellpadding="0" cellspacing="0" border="0" width="100%" class="white-background box-shadow" style="background-color:#ffffff;box-shadow:0 5px 90px #fbd3a4;"><!-- Header -->
                  <tr>
                     <!-- Fall back for Outlook.com and Yahoo included --><!-- Background = imglink. Fall back for Outlook.com and Yahoo included --><td height="60" style="border:none; background-color:#f68b1c;">
                     <table class="halves" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                           <td width="2%"> </td>
                           <td width="48%">
                              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                 <tr height="60">
                                    <td valign="middle">
                                       <!-- SignUpGenius Logo --><a href="https://www.signupgenius.com" target="_blank" style="cursor:pointer;"><img src="https://www.signupgenius.com/cms/images/emails/2016/signupgeniuslogo320.png" width="160" height="42" border="0" alt="SignUpGenius" /> </a>
                                    </td>
                                 </tr>
                              </table>
                           </td>
                           <td width="48%">
                              <table align="right" cellpadding="0" cellspacing="0" border="0" width="100%">
                                 <tr height="60"><td valign="middle" class="white-color group-organizing-text" style="color:#ffffff;font-family:helvetica,arial, sans-serif;text-align:right;font-weight:bold;position:relative;top:2px;font-size:18px;vertical-align:middle;">Group Organizing Made Easy</td></tr>
                              </table>
                           </td>
                           <td width="2%"> </td>
                        </tr>
                     </table>
                     </td>
                  </tr>
                  <tr>
                     <td class="orange-background height-4" width="100%" height="4" style="background-color:#f68b1c;font-size:1px;line-height:1px;height:4px;">&nbsp;</td>
                  </tr>
                  <tr>
                     <td class="white-background" width="100%" height="40" style="background-color:#ffffff;">&nbsp;</td>
                  </tr>
                  <!-- Message Text -->
                  <tr>
                     <td width="100%">
                        <!--Clear Space-->
                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                           <tr>
                              <td width="8%"></td>
                              <td class="message-text black-color" width="84%" style="color:#000000;font-size:18px;text-align:left;font-family:helvetica, arial, sans-serif;line-height: 27px;"> Hello!<br /><br />Hi! I'm organizing a school volunteer event and would love your help. Please click the link below to sign up for a time slot that works for you. Thank you!<a href="#" style="display:inline-block;padding:12px 24px;background-color:#fd8d14;color:#white;text-decoration:none;border-radius:4px;font-weight:bold;">Sign Up</a> </td>
                              <td width="8%"></td>
                           </tr>
                        </table>
                     </td>
                  </tr>
                  <tr>
                     <td class="white-background" width="100%" height="40" style="background-color:#ffffff;">&nbsp;</td>
                  </tr>
                  <!-- email ad --><!-- Snippet Area -->
                  <tr>
                     <td class="orange-background height-4" width="100%" height="4" style="background-color:#f68b1c;font-size:1px;line-height:1px;height:4px;">&nbsp;</td>
                  </tr>
               </table>
               <!--Clear Space-->
            </td>
         </tr>
         <tr>
            <td class="height-10" height="10">&nbsp;</td>
         </tr>
         <tr height="45">
            <!-- footer --><td class="suglinks gray2-color" style="color:#aaaaaa;font-size:12px;line-height:18px; text-align:center;font-family:arial, sans-serif;"> <span class="appleLinksGray">1213 W. Morehead Street, Suite 500, Charlotte, NC 28208<br>&copy; 2025 SignUpGenius. All Rights Reserved.</span> | <a href="https://www.signupgenius.com/privacy" style="color:#bbbbbb;" target="_blank">Privacy Policy</a> | <a href="#" style="color:#bbbbbb;" target="_blank">Unsubscribe</a> </td>
         </tr>
         <tr height="35">
            <td> </td>
         </tr>
         </table></td>
         <td class="width-35" style="min-width:35px;max-width:35px;width:35px;"> </td>
         </tr></table> <!-- This text prevents the Gmail App from doing bad stuff to our HTML Email --><div align="center" class="g-mail" style="height:1px;white-space:nowrap;font:15px courier;text-align:center;margin:0 auto;border:0px solid transparent;width:601px;min-width:601px;color:transparent;"> - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
      </div>
      </div>
   </body>
</html>`,
    };

    this.emailHtmlPreview = mockPreviewData.HTMLPREVIEW;
    this.emailTextPreview = mockPreviewData.TEXTPREVIEW;

    // Get theme and image from selected signup
    if (this.selectedSignups.length > 0) {
      const firstSignup = this.selectedSignups[0] as unknown as Record<
        string,
        string
      >;
      // Extract theme ID and signup image from the selected signup
      // These properties should come from your SignUpItem interface
      this.selectedThemeId = firstSignup['themeid'] || null;
      this.selectedThemeImage = firstSignup['signupimage'] || '';
    }

    // Load available themes (you would typically get this from an API)
    this.availableThemes = [
      { label: 'Theme 1', value: 'theme1' },
      { label: 'Theme 2', value: 'theme2' },
    ];
  }

  // Method to handle dialog radio selection
  handleDialogSelection(event: RadioCheckboxChangeEvent) {
    this.selectedSignupValue = event.value;
  }

  // Method to handle people send message dialog radio selection
  handlePeopleSendMessageDialogSelection(event: RadioCheckboxChangeEvent) {
    this.peopleSendMessageSelectedValue = event.value;
  }

  // Method to preview account index
  previewAcctIndex() {
    // Add your preview logic here
  }

  // Method to show tooltip info
  showTooltipInfo() {
    // You can show additional info or another dialog here
  }

  showOptionsAgain() {
    this.showRadioButtons = true;
    this.selectedValue = null; // Reset the selected size

    // Reset main forms
    this.emailFormOne.reset();
    this.emailFormTwo.reset();

    // Reset dialog forms
    this.peopleDialogForm.reset();
    this.peopleSendMessageDialogForm.reset();
    this.signUpDialogForm.reset();

    // Clear selections
    this.selectedSignups = [];
    this.selectedTabGroups = [];
    this.selectedGroups = [];
    this.selectedValues = [];
    this.isSignUpIndexPageSelected = false;
    this.recipientCount = 0;
    this.recipient = [];
    this.peopleDialogForm.reset();
    this.toggleReplyToControl();
    this.loadUserProfileData();
  }

  sendEmail() {
    // In a real app, you would gather form data and send it.
  }

  // Select Group Dialog Table Data
  tableData = [
    {
      fName: 'Aly',
      lName: 'Comet',
      email: 'alycomet@skylark.net',
      group:
        'Aly 12/9, Aly 12/9 long group name so that we can see what happens on the transfer pa, Aly 12/9 long group name so that we can see what happens on the transfer pa',
    },
    {
      fName: 'Aly',
      lName: 'dancer',
      email: 'alydancer@skylark.net',
      group:
        'Aly 12/9, Aly 12/9 long group name so that we can see what happens on the transfer pa, Aly 12/9 long group name so that we can see what happens on the transfer pa',
    },
    {
      fName: 'Aly',
      lName: 'Meylan',
      email: 'alym@signupgenius.com',
      group:
        'Aly 12/9, Aly 12/9 long group name so that we can see what happens on the transfer pa, Aly 12/9 long group name so that we can see what happens on the transfer pa',
    },
    {
      fName: 'Aly',
      lName: 'Other',
      email: 'alyother@skylark.net',
      group:
        'Aly 12/9, Aly 12/9 long group name so that we can see what happens on the transfer pa, Aly 12/9 long group name so that we can see what happens on the transfer pa',
    },
    {
      fName: 'Aly',
      lName: 'Platinum',
      email: 'alyplat@skylark.net',
      group:
        'Aly 12/9, Aly 12/9 long group name so that we can see what happens on the transfer pa, Aly 12/9 long group name so that we can see what happens on the transfer pa',
    },
  ];
  tableConfig: ISugTableConfig = {};
  tableColumns: ISugTableColumn[] = [
    {
      field: 'fName',
      header: 'First Name',
      sortable: true,
      filterable: false,
    },
    {
      field: 'lName',
      header: 'Last Name',
      sortable: true,
      filterable: false,
    },
    {
      field: 'email',
      header: 'Email',
      sortable: true,
      filterable: false,
    },
    {
      field: 'group',
      header: 'Group',
      sortable: true,
      filterable: false,
    },
  ];
  tableSignUpColumns: ISugTableColumn[] = [
    {
      field: 'starttime',
      header: 'Date',
      sortable: true,
      filterable: false,
    },
    {
      field: 'item',
      header: 'Slots',
      sortable: true,
      filterable: false,
    },
    {
      field: 'signedupmembers',
      header: 'Signed Up',
      sortable: false,
      filterable: false,
    },
  ];
  tableSignUpData: Array<{
    starttime: string;
    item: string;
    location: string;
    qtytaken: number;
    qtyremaining: number;
    signedupmembers: string;
    slotitemid: number;
  }> = [];
  dateSlots: Array<{
    slotid: number;
    slotitemid: number;
    item: string;
    starttime: string;
    location: string;
    qtytaken: number;
    qtyremaining: number;
    signedupmembers?: string;
  }> = [];
  dateSlotsPage = 1;
  dateSlotsLimit = 50;
  dateSlotsTotalPages = 1;
  dateSlotsLoading = false;

  // Table configuration for date slots with selection enabled
  tableSignUpConfig: ISugTableConfig = {
    selectionMode: 'multiple',
    dataKey: 'slotitemid',
  };

  onSort(event?: { field: string; order: number }): void {
    // Handle table sorting for date slots - update sort parameters and reload
    if (event) {
      const direction = event.order === 1 ? 'asc' : 'desc';
      this.currentSortBy = `${event.field},${direction}`;
      this.loadDateSlots();
    }
    // For other tables without event, just handle sort event
  }

  onFilter(): void {
    // Handle table filtering
    // Implementation can be added based on requirements
  }

  onPage(): void {
    // Handle table pagination
    // Implementation can be added based on requirements
  }

  getSignupTitle(item: ISignUpItem | string): string {
    let parsedItem: ISignUpItem;

    if (typeof item === 'string') {
      parsedItem = JSON.parse(item);
    } else {
      parsedItem = item;
    }

    const title =
      parsedItem?.fulltitle || parsedItem?.title || 'No Title Available';
    return title;
  }

  removeSignup(index: number) {
    // Prevent removing multiple items by checking if index is valid
    if (index < 0 || index >= this.selectedSignups.length) {
      return;
    }

    // Remove the signup at the specified index
    this.selectedSignups.splice(index, 1);

    // Convert the remaining signups to JSON strings for the form
    const signupValues = this.selectedSignups.map((item) =>
      JSON.stringify(item)
    );

    // Update the dialog form
    this.signUpDialogForm.patchValue({
      selectedSignups: signupValues,
    });

    // Update the main form based on which form is active
    const currentForm =
      this.selectedValue === 'emailoptionone'
        ? this.emailFormOne
        : this.emailFormTwo;
    currentForm.patchValue({ selectedSignups: this.selectedSignups });

    // Update subject and message after removing signup
    if (this.selectedSignups.length > 0) {
      this.updateSubjectAndMessage();
    } else {
      // Clear subject and message if no signups left
      currentForm.patchValue({
        subject: '',
        message: '',
      });
    }
    // Toggle Reply To control after removing signup
    this.toggleReplyToControl();
  }

  removeTabGroup(index: number) {
    // Prevent removing multiple items by checking if index is valid
    if (index < 0 || index >= this.selectedTabGroups.length) {
      return;
    }

    // Remove the tab group at the specified index
    this.selectedTabGroups.splice(index, 1);

    // Convert the remaining tab groups to their values for the form
    const tabGroupValues = this.selectedTabGroups.map((group) => group.value);

    // Update the dialog form
    this.signUpDialogForm.patchValue({
      selectedTabGroups: tabGroupValues,
    });

    // Note: Tab groups don't affect the main form (emailFormOne/emailFormTwo)
    // They are only used in the dialog for selection purposes
  }

  removeSignUpIndexPage() {
    // Clear the Sign Up Index Page selection
    this.isSignUpIndexPageSelected = false;

    // Update the dialog form
    this.signUpDialogForm.patchValue({
      selectedSignupValue: null,
    });

    // Clear subject and message fields
    const currentForm =
      this.selectedValue === 'emailoptionone'
        ? this.emailFormOne
        : this.emailFormTwo;
    currentForm.patchValue({
      subject: '',
      message: '',
    });

    // Disable form controls if no other selections exist
    this.toggleReplyToControl();
  }

  getSignupLinkRadioValue(event: RadioCheckboxChangeEvent) {
    // Update the selected signup link radio value
  }

  groupSelectionValueChange(event: { value: string[] }, formType: string) {
    this.selectedValues = event.value;
    const form =
      formType === 'formOne'
        ? this.peopleDialogForm
        : this.peopleSendMessageDialogForm;
    form.patchValue({ selectedGroups: event.value });
  }

  /**
   * Handle form submission for Preview & Send
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPreviewAndSend(formType: 'formOne' | 'formTwo') {
    this.loadPreviewData();
    this.openPreViewEmailDialog();

    // TODO: Uncomment validation when ready
    // const form = formType === 'formOne' ? this.emailFormOne : this.emailFormTwo;
    // if (form.valid) {
    //   this.loadPreviewData();
    //   this.openPreViewEmailDialog();
    // } else {
    //   Object.keys(form.controls).forEach((key) => {
    //     form.get(key)?.markAsTouched();
    //   });
    //   this.toastr.error('Please fill in all required fields', 'Error');
    // }
  }

  /**
   * Handle save draft functionality
   */
  onSaveDraft(formType: 'formOne' | 'formTwo') {
    const form = formType === 'formOne' ? this.emailFormOne : this.emailFormTwo;
  }

  handleSelection(event: RadioCheckboxChangeEvent) {
    this.selectedValue = event.value; // Update the selected size
    this.showRadioButtons = false; // Hide the radio buttons
  }

  closePeopleDialog(close: boolean) {
    this.closePersonSelectionDialog('people', close);
  }

  getGroupMembers() {
    this.isLoading = true;

    // Determine which form to use based on which dialog is visible or has data
    const dialogForm =
      this.isPeopleSendMessageDialogVisible ||
      this.peopleSendMessageDialogForm.get('peopleSendMessageSelectedValue')
        ?.value
        ? this.peopleSendMessageDialogForm
        : this.peopleDialogForm;

    const formValues = dialogForm.value;
    const selectedOption = formValues.peopleSendMessageSelectedValue;

    // Build payload based on form selections
    const payload: {
      sentToType: string;
      sentTo: string;
      messageTypeId: number;
      groupIds?: number[];
      signupIds?: number[];
      filters: {
        p_page: number;
        p_limit: number;
      };
    } = {
      sentToType: '',
      sentTo: '',
      messageTypeId: 1, // Email by default
      filters: {
        p_page: 1,
        p_limit: 1000,
      },
    };

    payload.signupIds = this.selectedSignups.map((signup) =>
      parseInt(signup.signupid?.toString() || '0', 10)
    );

    // Determine the payload based on selected radio option
    if (selectedOption === 'specificRsvpResponse') {
      // RSVP-specific targeting
      payload.sentToType = 'specificrsvp';

      // Get selected RSVP responses
      const selectedResponses = this.getSelectedRsvpResponses();

      if (selectedResponses.length === 0) {
        this.toastr.error('Please select at least one RSVP response', 'Error');
        this.isLoading = false;
        return;
      }

      // Format: rsvp:yes,no,maybe,nr
      payload.sentTo = `rsvp:${selectedResponses.join(',')}`;

      // RSVP requires both signupIds and groupIds
      if (this.selectedSignups.length === 0) {
        this.toastr.error(
          'Please select a signup to filter RSVP responses',
          'Error'
        );
        this.isLoading = false;
        return;
      }

      // Get groupIds if available (optional but recommended for RSVP)
      if (this.selectedValues && this.selectedValues.length > 0) {
        payload.groupIds = this.selectedValues.map((id) => parseInt(id, 10));
      }
    } else if (selectedOption === 'peopleWhoSignedUp') {
      // People who have signed up
      payload.sentToType = 'signedup';
      payload.sentTo = 'signedup';

      if (this.selectedSignups.length === 0) {
        this.toastr.error('Please select a signup', 'Error');
        this.isLoading = false;
        return;
      }
    } else if (selectedOption === 'peopleWhoNotSignedUp') {
      // People who have NOT signed up (group members)
      payload.sentToType = 'peopleingroups';
      payload.sentTo = 'notsignedup';

      const selectedGroupIds = formValues.selectedGroups || [];
      if (selectedGroupIds.length === 0) {
        this.toastr.error('Please select at least one group', 'Error');
        this.isLoading = false;
        return;
      }

      if (this.selectedSignups.length === 0) {
        this.toastr.error('Please select a signup', 'Error');
        this.isLoading = false;
        return;
      }

      payload.groupIds = selectedGroupIds.map((id: string) => parseInt(id, 10));
    } else if (selectedOption === 'sendMessagePeopleRadio') {
      // People in specific group(s)
      payload.sentToType = 'peopleingroups';

      const selectedGroupIds = formValues.selectedGroups || [];
      if (selectedGroupIds.length === 0) {
        this.toastr.error('Please select at least one group', 'Error');
        this.isLoading = false;
        return;
      }

      payload.groupIds = selectedGroupIds.map((id: string) => parseInt(id, 10));

      // Check if "includeNonGroupMembersForPeople" is checked
      const includeNonGroupMembers =
        formValues.includeNonGroupMembersForPeople &&
        formValues.includeNonGroupMembersForPeople.length > 0;

      if (includeNonGroupMembers && this.selectedSignups.length > 0) {
        // Include both group members and non-group members who signed up
        payload.sentTo = 'includenongroupmembers';
      } else {
        // All group members
        payload.sentTo = 'all';
      }
    } else if (selectedOption === 'sendMessagePeopleIselect') {
      // People I will select - custom selection, no API call needed
      this.isLoading = false;
      return;
    } else if (selectedOption === 'peopleingroups') {
      // Legacy support for old option value
      payload.sentToType = 'peopleingroups';
      payload.groupIds = this.selectedValues.map((id) => parseInt(id, 10));

      // Check if "includeNonGroupMembers" is checked
      const includeNonGroupMembers =
        formValues.includeNonGroupMembers &&
        formValues.includeNonGroupMembers.length > 0;

      if (includeNonGroupMembers && this.selectedSignups.length > 0) {
        // Include both group members and non-group members who signed up
        payload.sentTo = 'includenongroupmembers';
      } else if (this.selectedSignups.length > 0) {
        // Only group members who have NOT signed up
        payload.sentTo = 'notsignedup';
      } else {
        // All group members
        payload.sentTo = 'all';
      }
    } else if (selectedOption === 'ManuallyEnterEmail') {
      // Manual email entry - no API call needed, handled differently
      this.isLoading = false;
      return;
    } else if (selectedOption === 'ImportEmailFromProvider') {
      // Import from provider - handle separately
      this.isLoading = false;
      return;
    }

    // Make the API call
    this.composeService
      .getGroupMembers(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (apiResponse) => {
          // Handle v3 API response with nested data structure
          if (apiResponse.data?.data?.recipients) {
            // Map Recipient[] from v3 API (nested in data.data) to component format
            this.recipient = apiResponse.data.data.recipients.map(
              (recipient) => ({
                memberid: recipient.memberid,
                email: recipient.email,
                displayname: recipient.displayname,
                mobile: recipient.mobile,
                smsoptin: recipient.smsoptin,
                // Map additional fields from Recipient to GroupMember structure
                id: recipient.memberid,
                communitymemberid: recipient.memberid,
                firstname: recipient.displayname?.split(' ')[0] || '',
                lastname:
                  recipient.displayname?.split(' ').slice(1).join(' ') || '',
                isgroupemail: false,
              })
            );
            this.recipientCount = apiResponse.data.data.recipients.length;
          } else if (apiResponse.data && apiResponse.data.members) {
            // Fallback for old API response format (if any legacy endpoints still use it)
            this.recipient = apiResponse.data.members;
            this.recipientCount = apiResponse.data.members.length;
          } else {
            this.recipient = [];
            this.recipientCount = 0;
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.recipient = [];
          this.recipientCount = 0;
          this.isLoading = false;
        },
      });
  }

  getGroupforMembers() {
    this.isLoading = true;
    this.composeService
      .getGroupforMembers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (apiResponse) => {
          if (apiResponse && apiResponse.success) {
            this.sendMessageSelectOne = apiResponse.data.map((group) => ({
              label: group.title,
              value: group.id.toString(),
            }));
            this.sendMessageSelectTwo = this.sendMessageSelectOne;
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.sendMessageSelectOne = [];
          this.sendMessageSelectTwo = [];
          this.isLoading = false;
        },
      });
  }

  getSignUpList() {
    this.isLoading = true;
    this.signUpOptions = []; // Clear existing options
    this.composeService
      .getSignUpList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (apiResponse) => {
          if (apiResponse.data && apiResponse.success) {
            const rsvpSignUps = apiResponse.data.filter(
              (signup) => signup.mode?.toLowerCase() === 'rsvp'
            );
            const regularSignUps = apiResponse.data.filter(
              (signup) => signup.mode?.toLowerCase() === 'standard'
            );

            if (rsvpSignUps.length > 0) {
              this.signUpOptions.push({
                label: 'RSVP Sign Ups',
                value: 'rsvp-group',
                items: rsvpSignUps.map((item) => ({
                  label: item.fulltitle,
                  value: JSON.stringify(item),
                })),
              });
            }

            // // Add Regular Sign Ups group if there are any
            if (regularSignUps.length > 0) {
              this.signUpOptions.push({
                label: 'Standard Sign Ups',
                value: 'standard-group',
                items: regularSignUps.map((item) => ({
                  label: item.fulltitle,
                  value: JSON.stringify(item),
                })),
              });
            }
          } else {
            this.signUpOptions = [];
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
        },
      });
  }

  getSubAdmins() {
    this.isLoading = true;
    this.composeService
      .getSubAdmins()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (apiResponse) => {
          if (apiResponse && apiResponse.data) {
            this.subAdminsData = apiResponse.data.map((admin) => ({
              label: `${admin.firstname} ${admin.lastname} (${admin.email})`,
              value: admin.id.toString(),
            }));
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.subAdminsData = [];
        },
      });
  }

  getTabGroups() {
    this.isLoading = true;
    this.composeService
      .getTabGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (apiResponse) => {
          if (apiResponse && apiResponse.data) {
            this.tabGroupsData = apiResponse.data.map(
              (group: { name: string; id: number | string }) => ({
                label: group.name,
                value: group.id.toString(),
              })
            );
          }
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.tabGroupsData = [];
        },
      });
  }

  /**
   * Cleanup subscriptions on component destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // getCloudSpongeServices() {
  //   this.composeService.getCloudSpongeServices().subscribe({
  //     next: (apiResponse) => {
  //       if (apiResponse && apiResponse.SUCCESS) {
  //         this.cloudSponseServicesData = apiResponse.DATA.split(',');
  //       }
  //     },
  //     error: (error) => {
  //       this.cloudSponseServicesData = [];
  //     },
  //   });
  // }
}
