import {
  ISignUpItem,
  ISubAdmin,
  IGroupItem,
  MessageStatus,
  SentTo,
  SendToType,
  ICreateMessageRequest,
  IMessagePreviewRequest,
} from '@services/interfaces/messages-interface/compose.interface';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  SugUiRadioCheckboxButtonComponent,
  RadioCheckboxChangeEvent,
  SugUiButtonComponent,
  SugUiTooltipComponent,
  SugUiMultiSelectDropdownComponent,
  SugUiLoadingSpinnerComponent,
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
import { MemberProfile } from '@services/interfaces/member-profile.interface';
import { NgxCaptchaModule } from 'ngx-captcha';
import { environment } from '@environments/environment';
import { HelpDialogComponent } from '../../utils/help-dialog/help-dialog.component';
import { ComposeEmailStateService } from '../../utils/services/compose-email-state.service';
import { PeopleSelectionDialogComponent } from '../../utils/people-selection-dialog/people-selection-dialog.component';
import { DateSlotsSelectionComponent } from '../../utils/date-slots-selection/date-slots-selection.component';
import { RecipientDetailsDialogComponent } from '../../utils/recipient-details-dialog/recipient-details-dialog.component';
import { FileSelectionDialogComponent } from '../../utils/file-selection-dialog/file-selection-dialog.component';
import { PreviewEmailComponent } from '../../utils/preview-email/preview-email.component';
import { ToastrService } from 'ngx-toastr';
import { MyGroupSelection } from '../../utils/my-group-selection/my-group-selection';

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
    PreviewEmailComponent,
    SugUiLoadingSpinnerComponent,
    MyGroupSelection,
  ],
  providers: [ComposeEmailStateService],
  templateUrl: './compose-text-message.html',
  styleUrls: ['./compose-text-message.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ComposeTextMessageComponent implements OnInit, OnDestroy {
  composeService = inject(ComposeService);
  private cdr = inject(ChangeDetectorRef);
  protected readonly userStateService = inject(UserStateService);
  private fb = inject(FormBuilder);
  stateService = inject(ComposeEmailStateService);
  private toastr = inject(ToastrService);
  inviteTextForm!: FormGroup;
  sendTextEmailForm!: FormGroup;
  isDateSlotsDialogVisible = false;
  isRecipientDialogVisible = false;
  isLoading = false;
  showProfile = false;
  showEmail = false;
  isFromTextMessage = false;
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
  subAdminsApiData: ISubAdmin[] = [];
  grooupApiResponse: IGroupItem[] = [];
  defaultOption: ISelectOption = this.subAdminsData[0];
  showRadioButtons = true;
  messageStatus = MessageStatus; // Expose enum to template
  selectedValue: string | null = null;
  radioOptions = [
    {
      label: 'Invite people to opt in to text messages',
      value: 'textOptionOne',
    },
    {
      label: 'Send a text message to people participating in a sign up',
      value: 'textOptionTwo',
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
  isPreviewVisible = false;
  emailHtmlPreview = '';
  availableThemes: Array<number> = [1];
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
  isMyGroupsDialogVisible = false;
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
          this.getSlotsForSignup(Number(value[0]));
          controlsToToggle.forEach((ctrl) =>
            this.sendTextEmailForm.get(ctrl)?.enable()
          );
        }
      });

    this.stateService.selectedGroups$
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedGroups) => {
        this.sendTextEmailForm.patchValue({ to: selectedGroups });
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

  // On My Groups selection
  openMyGroupDialog(): void {
    this.isMyGroupsDialogVisible = false;
    setTimeout(() => {
      this.isMyGroupsDialogVisible = true;
    });
  }

  onMyGroupsSelected(): void {
    // Called when date slots are selected from dialog
    this.closeMyGroupDialog();

    // Re-open the people selection dialog to show the selected slots
    setTimeout(() => {
      this.isPeopleDialogVisible = true;
    }, 100);
  }

  closeMyGroupDialog(): void {
    this.isMyGroupsDialogVisible = false;
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
    this.inviteTextForm.reset({
      themeid: 1,
    });
    this.sendTextEmailForm.reset({
      themeid: 1,
    });
    this.loadUserProfile();
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
    this.isPeopleDialogVisible = true;
  }

  get hasPeopleSelection(): boolean {
    return this.stateService.selectedGroups.length > 0;
  }

  getSelectedSignup() {
    const selectedSignup = this.signupOptionsData.filter(
      (signup) =>
        Number(
          (this.sendTextEmailForm.get('selectedSignups')?.value ?? [])[0]
        ) === signup.signupid
    );
    this.sendTextEmailForm.patchValue({
      emailSubject: selectedSignup[0]?.title || '',
    });
    return selectedSignup;
  }

  showRecipientDetails(): void {
    // Reset dialog state to ensure clean reopening
    this.isRecipientDialogVisible = true;
  }

  // Get current form based on selected template type
  get currentEmailForm(): FormGroup {
    return this.selectedValue === 'textOptionOne'
      ? this.inviteTextForm
      : this.sendTextEmailForm;
  }

  get currentFormType(): 'inviteToSignUp' | 'emailParticipants' {
    return this.selectedValue === 'textOptionOne'
      ? 'inviteToSignUp'
      : 'emailParticipants';
  }

  setSelectedRadio(event: {
    selectedValue: string;
    includeNonGroupMembers: boolean;
    recipients: (
      | string
      | number
      | { value: string | number }
      | { slotid: number; waitlist: boolean }
    )[];
  }): void {
    this.selectedRadioOption = event;
  }

  scheduleEmail(event: string): void {
    this.saveDraft(MessageStatus.SCHEDULED, event);
  }

  saveDraft(status: MessageStatus, date?: string) {
    this.isLoading = true;
    const form = this.currentEmailForm.value;

    // Only extract numeric group IDs, filtering out non-numeric values like 'sendMessagePeopleIselect'
    const groups = form.to
      ? form.to
          .map((g: string | { label: string; value: string | number }) => {
            if (typeof g === 'object' && g !== null && 'value' in g) {
              return parseInt(String(g.value), 10);
            }
            return parseInt(String(g), 10);
          })
          .filter((id: number) => !isNaN(id))
      : this.stateService.selectedGroups
          .map((g) => parseInt(g.value, 10))
          .filter((id: number) => !isNaN(id));

    const payload: ICreateMessageRequest = {
      subject: form.subject || form.emailSubject,
      body: form.message,
      sentto: SentTo.PEOPLE_IN_GROUPS,
      sendtotype: SendToType.ALL,
      status: status,
      messagetypeid: this.selectedValue === 'textOptionOne' ? 14 : 15,
      sendasemail: this.selectedValue === 'textOptionTwo' ? true : false,
      sendastext: true,
      themeid: form.themeid,
      contactname: form.fromName || form.emailFrom,
      replytoids: this.subAdminsApiData
        .filter((su) =>
          (form.replyTo ?? form.emailReplyTo).includes(
            String(su.id || su.email)
          )
        )
        .map((su) => su.id),
      signupids: form.selectedSignups
        ?.map((signup: string | number | { value: string | number }) => {
          if (
            typeof signup === 'object' &&
            signup !== null &&
            'value' in signup
          ) {
            return parseInt(String(signup.value), 10);
          }
          return parseInt(String(signup), 10);
        })
        .filter((id: number) => !isNaN(id)),
      groupids: groups,
    };
    if (date) {
      payload.senddate = date;
    }

    // Handle radio selection logic
    switch (this.selectedRadioOption.selectedValue) {
      case 'peopleingroups':
      case 'sendMessagePeopleRadio':
        payload.sendtotype = SendToType.PEOPLE_IN_GROUPS;
        payload.sentto = SentTo.ALL;
        payload.groupids = this.stateService.selectedGroups.map((g) =>
          parseInt(g.value)
        );
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
        payload.sentto = SentTo.SIGNED_UP;
        payload.groupids = [];
        break;

      case 'peopleSignedUpAndWaitlist':
        payload.sendtotype = SendToType.SIGNUP_WAITLIST;
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
          payload.slotids = this.selectedRadioOption.recipients
            .filter(
              (slot): slot is { slotid: number; waitlist: boolean } =>
                typeof slot === 'object' &&
                slot !== null &&
                'slotid' in slot &&
                'waitlist' in slot
            )
            .map((slot) => 'slot_' + slot.slotid);
          payload.sendToGroups = this.selectedRadioOption.recipients
            .filter(
              (slot): slot is { slotid: number; waitlist: boolean } =>
                typeof slot === 'object' &&
                slot !== null &&
                'slotid' in slot &&
                'waitlist' in slot
            )
            .map((slot) => ({
              id: 'slot_' + slot.slotid,
              isWaitlistedRow: slot.waitlist,
            }));
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
        if (this.sendTextEmailForm.get('includefallback')?.value === true) {
          this.onPreviewAndSend(this.currentEmailForm);
        }
      },
    });
  }

  onThemeChange(themeId: number): void {
    this.currentEmailForm.get('themeid')?.setValue(themeId || 1);
    this.onPreviewAndSend(this.currentEmailForm);
  }

  onPreviewAndSend(form: FormGroup): void {
    this.isLoading = true;
    const payload: IMessagePreviewRequest = {
      fromname: form.value.fromName || form.value.emailFrom,
      replyto: this.subAdminsApiData
        .filter((su) =>
          (form.value.replyTo ?? form.value.emailReplyTo).includes(
            String(su.id || su.email)
          )
        )
        .map((su) => su.email),
      subject: form.value.subject || form.value.emailSubject,
      message: form.value.message,
      emailType: this.selectedValue === 'textOptionOne' ? '14' : '15',
      themeid: form.value.themeid,
      signups: this.getSelectedSignup().map((su) => ({
        id: su.signupid,
        title: su.title,
        themeid: su.themeid ?? 1,
      })),
    };
    this.availableThemes = [
      1,
      ...this.signupOptionsData.map((su) => su.themeid),
    ];

    if (this.getSelectedSignup().length === 0) {
      payload.signUpType = 'acctindex';
    }
    if (form.value.to && form.value.to.length > 0) {
      payload.sendTo = form.value.to.map(
        (person: string | { label: string; value: string | number }) => {
          // Handle case where person is just a string (like '37826')
          if (typeof person === 'string') {
            return {
              id: Number(person),
              displayName: person,
              isChecked: true,
            };
          }
          // Handle case where person is an object with label and value
          return {
            id: Number(person.value),
            displayName: person.label,
            isChecked: true,
          };
        }
      );
    }
    // Load signups
    this.composeService.messagePreview(payload).subscribe({
      next: (response) => {
        if (
          response?.success &&
          response.data &&
          response.data.textpreview.length > 0
        ) {
          this.emailHtmlPreview = response.data.htmlpreview;
          this.currentEmailForm
            .get('token')
            ?.removeValidators(Validators.required);
          this.currentEmailForm.get('token')?.updateValueAndValidity();
          setTimeout(() => {
            this.isPreviewVisible = true;
            this.isLoading = false;
            this.cdr.detectChanges();
          });
        }
      },
      error: () => {
        this.isLoading = false;
        this.isPreviewVisible = false;
      },
    });
  }

  /**
   * Called when preview dialog is closed. Reset preview related state so
   * reopening the dialog shows default values (themeid=1 and empty preview).
   */
  onPreviewClose(): void {
    // Ensure the dialog visibility flag is false
    this.isPreviewVisible = false;

    // Reset the preview HTML shown in the dialog
    this.emailHtmlPreview = '';

    // Reset available themes and form theme to default (1)
    this.availableThemes = [1];
    this.currentEmailForm.get('themeid')?.setValue(1);
    this.currentEmailForm.get('token')?.addValidators(Validators.required);
    this.currentEmailForm.get('token')?.updateValueAndValidity();
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
      themeid: [1],
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
      themeid: [1],
      to: [''],
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
                replyTo: profile.email,
                message:
                  fullName +
                  ' invites you to opt in to the SignUpGenius text messaging service. Your privacy is our top priority, and this is a voluntary opt-in process designed to provide updates related to your sign up participation. You may unsubscribe at any time.',
              });
            }
            this.sendTextEmailForm.patchValue({
              emailFrom: fullName,
              message: 'From ' + fullName + ':',
              emailReplyTo: profile.email,
            });
          }
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
    this.isLoading = true;
    this.composeService.getGroupforMembers().subscribe({
      next: (response) => {
        if (response?.data) {
          this.grooupApiResponse = response.data;
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
            this.subAdminsApiData = apiResponse.data;
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

  getSlotsForSignup(signupId: number): void {
    this.isLoading = true;
    const payload = {
      includeSignedUpMembers: true,
    };
    this.composeService.getDateSlots(signupId, payload).subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.isFromTextMessage =
            response.data.filter((item) => item.waitlist === true).length > 0;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
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
