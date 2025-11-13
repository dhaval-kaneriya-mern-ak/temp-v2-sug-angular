import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import {
  SugUiRadioCheckboxButtonComponent,
  RadioCheckboxChangeEvent,
  SugUiButtonComponent,
  SugUiTooltipComponent,
  SugUiMultiSelectDropdownComponent,
  DialogConfig,
} from '@lumaverse/sug-ui';
import { ISelectOption } from '@lumaverse/sug-ui';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ComposeService } from '../compose.service';
import { Subject, takeUntil } from 'rxjs';
import { UserStateService } from '@services/user-state.service';
import { MemberProfile, ISignUpItem } from '@services/interfaces';
import { NgxCaptchaModule } from 'ngx-captcha';
import { environment } from '@environments/environment';
import { HelpDialogComponent } from '../../utils/help-dialog/help-dialog.component';
import { ComposeEmailStateService } from '../../utils/services/compose-email-state.service';
import { PeopleSelectionDialogComponent } from '../../utils/people-selection-dialog/people-selection-dialog.component';
import { DateSlotsSelectionComponent } from '../../utils/date-slots-selection/date-slots-selection.component';
import { RecipientDetailsDialogComponent } from '../../utils/recipient-details-dialog/recipient-details-dialog.component';
import { FileSelectionDialogComponent } from '../../utils/file-selection-dialog/file-selection-dialog.component';

@Component({
  selector: 'sug-compose-text-message',
  standalone: true,
  imports: [
    CommonModule,
    SugUiRadioCheckboxButtonComponent,
    SugUiButtonComponent,
    SugUiTooltipComponent,
    ButtonModule,
    BadgeModule,
    SugUiMultiSelectDropdownComponent,
    ReactiveFormsModule,
    NgxCaptchaModule,
    HelpDialogComponent,
    PeopleSelectionDialogComponent,
    DateSlotsSelectionComponent,
    RecipientDetailsDialogComponent,
    FileSelectionDialogComponent,
  ],
  providers: [ComposeEmailStateService],
  templateUrl: './compose-text-message.html',
  styleUrls: ['./compose-text-message.scss'],
})
export class ComposeTextMessageComponent implements OnInit, OnDestroy {
  composeService = inject(ComposeService);
  protected readonly userStateService = inject(UserStateService);
  private fb = inject(FormBuilder);
  stateService = inject(ComposeEmailStateService);
  inviteTextForm!: FormGroup;
  sendTextEmailForm!: FormGroup;
  isDateSlotsDialogVisible = false;
  isRecipientDialogVisible = false;
  isLoading = false;
  showProfile = false;
  showEmail = false;
  userProfile: MemberProfile | null = null;
  @Input() readonly siteKey: string = environment.siteKey;
  private readonly destroy$ = new Subject<void>();
  isPeopleDialogVisible = false;
  includeNonGroupMembersForGroups = false;
  isSelectFileDialogVisible = false;
  isHelpDialogVisible = false;
  subAdminsData: ISelectOption[] = [];
  groupData: ISelectOption[] = [];
  signupOptions: ISelectOption[] = [];
  signupOptionsData: ISignUpItem[] = [];
  defaultOption: ISelectOption = this.subAdminsData[0];
  showRadioButtons = true;
  selectedValue: string | null = null;
  radioOptions = [
    {
      label: 'Invite people to opt in to text messages',
      value: 'emailoptionone',
    },
    {
      label: 'Send a text message to people participating in a sign up',
      value: 'emailoptiontwo',
    },
  ];
  checkboxOptions = [
    { label: 'Include reply-to info', value: 'reply' },
    { label: 'Include sign up link', value: 'link' },
    {
      label: 'Send message via email when text is not available',
      value: 'fallback',
    },
  ];

  ngOnInit() {
    this.initializeForms();
    // Listen for changes on selectedSignups
    const controlsToToggle = [
      'message',
      'attachments',
      'includeOption',
      'emailSubject',
      'emailFrom',
      'emailReplyTo',
      'includefallback',
      'includereply',
    ];
    this.sendTextEmailForm
      .get('includefallback')
      ?.valueChanges.subscribe((val) => {
        if (val === false) {
          this.showEmail = false;
        }
      });
    this.sendTextEmailForm
      .get('selectedSignups')
      ?.valueChanges.subscribe((value) => {
        if (!value || value.length === 0) {
          controlsToToggle.forEach(
            (ctrl) => this.sendTextEmailForm.get(ctrl)?.disable(),
            this.stateService.clearAllSelections()
          );
        } else {
          controlsToToggle.forEach((ctrl) =>
            this.sendTextEmailForm.get(ctrl)?.enable()
          );
        }
      });

    controlsToToggle.forEach((ctrl) =>
      this.sendTextEmailForm.get(ctrl)?.disable()
    );
  }

  // Methods for "Select People" dialog
  openPeopleDialog() {
    this.isPeopleDialogVisible = true;
  }

  closePeopleDialog() {
    this.isPeopleDialogVisible = false;
  }
  openSelectFileDialog() {
    this.isSelectFileDialogVisible = true;
  }

  closeSelectFileDialog() {
    this.isSelectFileDialogVisible = false;
  }

  // Methods for help dialog
  openHelpDialog() {
    this.isHelpDialogVisible = true;
  }

  closeHelpDialog() {
    this.isHelpDialogVisible = false;
  }

  handleSelection(event: RadioCheckboxChangeEvent) {
    this.selectedValue = event.value; // Update the selected size
    this.showRadioButtons = false; // Hide the radio buttons
  }

  showOptionsAgain() {
    this.showRadioButtons = true;
    this.selectedValue = null; // Reset the selected size
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

  get hasPeopleSelection(): boolean {
    return this.stateService.selectedGroups.length > 0;
  }

  getSelectedSignup() {
    const selectedSignup = this.signupOptionsData.filter(
      (signup) =>
        Number(this.sendTextEmailForm.get('selectedSignups')?.value[0]) ===
        signup.signupid
    );
    this.sendTextEmailForm.patchValue({
      emailSubject: selectedSignup[0]?.title || '',
    });
    return selectedSignup;
  }

  showRecipientDetails(): void {
    // Reset dialog state to ensure clean reopening
    this.isRecipientDialogVisible = false;

    // Reopen after Angular completes current change detection cycle
    setTimeout(() => {
      this.isRecipientDialogVisible = true;
    });
  }

  // Get current form based on selected template type
  get currentEmailForm(): FormGroup {
    return this.selectedValue === 'emailoptionone'
      ? this.inviteTextForm
      : this.sendTextEmailForm;
  }

  get currentFormType(): 'inviteToSignUp' | 'emailParticipants' {
    return this.selectedValue === 'emailoptionone'
      ? 'inviteToSignUp'
      : 'emailParticipants';
  }

  handleReset(): void {
    this.currentEmailForm.get('token')?.reset();
  }

  handleExpire(): void {
    this.currentEmailForm.get('token')?.setValue(null);
  }

  handleSuccess(token: string): void {
    this.currentEmailForm.get('token')?.setValue(token);
  }

  private initializeForms(): void {
    // Create form for reminder email template
    this.inviteTextForm = this.fb.group({
      fromName: ['', Validators.required],
      replyTo: [''],
      subject: ['', Validators.required],
      message: ['', Validators.required],
      token: ['', Validators.required],
      to: [''],
    });

    // Create form for confirmation email template
    this.sendTextEmailForm = this.fb.group({
      token: ['', Validators.required],
      selectedSignups: [[], Validators.required],
      message: [{ value: '', disabled: true }, Validators.required],
      attachments: [[]],
      includefallback: false,
      includereply: false,
      includelink: false,
      emailSubject: '',
      emailFrom: '',
      emailReplyTo: '',
    });
    this.getSubAdmins();
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    this.userStateService.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.userProfile = profile;
          if (profile) {
            const fullName = `${profile.firstname || ''} ${
              profile.lastname || ''
            }`.trim();
            if (this.inviteTextForm) {
              this.inviteTextForm.patchValue({
                fromName: fullName,
                message:
                  fullName +
                  ' invites you to opt in to the SignUpGenius text messaging service. Your privacy is our top priority, and this is a voluntary opt-in process designed to provide updates related to your sign up participation. You may unsubscribe at any time.',
              });
            }
            this.sendTextEmailForm.patchValue({
              emailFrom: fullName,
              message: 'From ' + fullName + ':',
            });
          }
        },
        error: () => {
          // Error loading user profile
        },
      });
  }

  showProfileData() {
    this.showProfile = !this.showProfile;
  }

  showEmailData() {
    this.showEmail = !this.showEmail;
  }

  getGroups() {
    this.composeService.getGroupforMembers().subscribe({
      next: (response) => {
        if (response?.data) {
          const groupOptions = response.data.map((group) => ({
            label: group.title || 'Unnamed Group',
            value: group.id.toString(),
          }));
          this.stateService.setGroupOptions(groupOptions);
          this.groupData = groupOptions;
        }
        this.getSignups();
      },
      error: () => {
        this.isLoading = false;
        this.groupData = [];
      },
    });
  }

  getSignups() {
    this.isLoading = true;
    this.composeService.getSignUpList().subscribe({
      next: (response) => {
        if (response?.data) {
          this.signupOptionsData = response.data;
          const signupOptions = response?.data.map((signup) => ({
            label: signup.title,
            value: signup.signupid?.toString() || '',
          }));
          this.signupOptions = signupOptions;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.signupOptions = [];
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
          this.getGroups();
        },
        error: () => {
          this.isLoading = false;
          this.subAdminsData = [];
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
}
