import {
  ISignUpItem,
  ISubAdmin,
  IGroupItem,
  MessageStatus,
  SentTo,
  SendToType,
  ICreateMessageRequest,
  IMessagePreviewRequest,
  IGroupMember,
  IRecipient,
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
import {
  IUpdateUserPayload,
  MemberProfile,
} from '@services/interfaces/member-profile.interface';
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
  showTextRecipients = true;
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
  textRecipientsCount = 0;
  emailRecipientsCount = 0;
  shortUrl = '';
  ngOnInit() {
    this.initializeForms();
    // Listen for changes on selectedSignups
    const controlsToToggle = [
      'message',
      'attachments',
      'includeOption',
      'emailSubject',
      'userMobile',
      'emailFrom',
      'emailReplyTo',
      'includefallback',
      'includereply',
    ];
    this.sendTextEmailForm
      .get('includefallback')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if (val === false) {
          this.showEmail = false;
        }
      });
    this.sendTextEmailForm
      .get('includereply')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((shouldInclude) => {
        this.handleReplyTextToggle(shouldInclude);
      });
    this.sendTextEmailForm
      .get('includelink')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((shouldInclude) => {
        this.handleShortUrlToggle(shouldInclude);
      });
    this.sendTextEmailForm
      .get('selectedSignups')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
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

  showRecipientsCount(recipients: (IGroupMember | IRecipient)[]): void {
    this.stateService.setRecipients(recipients);
    this.textRecipientsCount = this.stateService.recipients.filter(
      (r) => 'smsoptin' in r && r.smsoptin === true
    ).length;
    this.emailRecipientsCount = this.stateService.recipients.filter(
      (r) => 'smsoptin' in r && r.smsoptin === false
    ).length;
  }

  showRecipientDetails(showTextRecipients: boolean): void {
    this.showTextRecipients = showTextRecipients;
    this.isRecipientDialogVisible = false;
    setTimeout(() => {
      this.isRecipientDialogVisible = true;
    });
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
      sendasemail: form.includefallback === true,
      sendastext: true,
      themeid: form.themeid,
      contactname: form.fromName || form.emailFrom,
      replytoids: this.filterReplyToAdmins(
        form.replyTo ?? form.emailReplyTo,
        'id'
      ) as number[],
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
              (slot): slot is { slotitemid: number; waitlist: boolean } =>
                typeof slot === 'object' &&
                slot !== null &&
                'slotitemid' in slot &&
                'waitlist' in slot
            )
            .map((slot) => 'slot_' + slot.slotitemid);
          payload.sendToGroups = this.selectedRadioOption.recipients
            .filter(
              (slot): slot is { slotitemid: number; waitlist: boolean } =>
                typeof slot === 'object' &&
                slot !== null &&
                'slotitemid' in slot &&
                'waitlist' in slot
            )
            .map((slot) => ({
              id: 'slot_' + slot.slotitemid,
              isWaitlistedRow: slot.waitlist,
            }));
        }
        break;
    }
    // Apply non-group members rule after switch (can override sentto)
    if (this.selectedRadioOption.includeNonGroupMembers) {
      payload.sentto = SentTo.PEOPLE_IN_GROUPS;
      payload.sendtotype = SendToType.ALL_INCLUDE_NON_GROUP_MEMBERS;
    }

    this.composeService
      .createMessage(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success === true) {
            this.toastr.success('Message saved successfully', 'Success');
            this.showOptionsAgain();
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.toastr.error(err.error.message[0]?.details, 'Error');
          if (
            this.sendTextEmailForm.get('includefallback')?.value === true &&
            status !== MessageStatus.DRAFT
          ) {
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
      replyto: this.filterReplyToAdmins(
        form.value.replyTo ?? form.value.emailReplyTo,
        'email'
      ) as string[],
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
    this.composeService
      .messagePreview(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
      userMobile: '',
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
              message: 'From ' + fullName,
              userMobile: profile.mobile,
              emailReplyTo: profile.email,
              includefallback: true,
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
    this.composeService
      .getGroupforMembers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
    this.composeService
      .getSignUpList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
    this.composeService
      .getDateSlots(signupId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.success && response.data) {
            this.isFromTextMessage =
              response.data.filter((item) => item.waitlist === true).length > 0;
          }
          this.isLoading = false;
          const urlPath = this.getSelectedSignup()[0]?.urlid?.split('go/')[1];
          if (urlPath) {
            this.getShortUrl(urlPath);
          }
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  getShortUrl(urlPath: string): void {
    this.isLoading = true;
    this.composeService
      .getShortUrl(urlPath)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.success && response.data) {
            this.shortUrl = response.data.url;
          }
          this.isLoading = false;
        },
        error: () => {
          this.shortUrl = '';
          this.isLoading = false;
        },
      });
  }

  updateUserMobileNumber() {
    const mobile = this.sendTextEmailForm?.value.userMobile || '';
    if (!mobile || mobile === '') {
      return;
    }
    this.isLoading = true;
    this.userStateService
      .updateUserProfile({
        phone: [
          { type: 'mobile', value: mobile, preferred: true, carrierid: 2 },
        ],
        email: this.userProfile?.email || '',
        firstname: this.userProfile?.firstname || '',
        lastname: this.userProfile?.lastname || '',
      } as IUpdateUserPayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('Profile updated successfully', 'Success');
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          const errorMessage =
            error.error?.message?.[0]?.details ||
            error.message ||
            'Failed to update profile';
          this.toastr.error(errorMessage, 'Error');
        },
      });
  }

  /**
   * Filter subAdmins based on reply-to value and return their IDs or emails
   */
  private filterReplyToAdmins(
    replyToValue: string | string[] | undefined,
    returnType: 'id' | 'email' = 'id'
  ): (number | string)[] {
    return this.subAdminsApiData
      .filter((su) => {
        if (!replyToValue) return false;
        // Handle both single email string and array of emails/IDs
        if (Array.isArray(replyToValue)) {
          return (
            replyToValue.includes(String(su.id)) ||
            replyToValue.includes(su.email)
          );
        }
        // Handle single email string
        return su.email === replyToValue;
      })
      .map((su) => (returnType === 'id' ? su.id : su.email));
  }

  /**
   * Handle toggling reply text in the message
   * @param shouldInclude - Whether to include or remove reply text
   */
  private handleReplyTextToggle(shouldInclude: boolean): void {
    const currentMessage = this.sendTextEmailForm.value.message;
    if (!currentMessage) return;

    const mobile = this.getMobileNumber();
    const updatedMessage = shouldInclude
      ? this.addReplyText(currentMessage, mobile)
      : this.removeReplyText(currentMessage, mobile);

    this.sendTextEmailForm.patchValue({ message: updatedMessage });
  }

  /**
   * Handle toggling short URL in the message
   * @param shouldInclude - Whether to include or remove short URL
   */
  private handleShortUrlToggle(shouldInclude: boolean): void {
    const currentMessage = this.sendTextEmailForm.value.message;
    if (!currentMessage) return;

    const updatedMessage = shouldInclude
      ? this.addShortUrl(currentMessage, this.shortUrl)
      : this.removeShortUrl(currentMessage, this.shortUrl);

    this.sendTextEmailForm.patchValue({ message: updatedMessage });
  }

  /**
   * Get mobile number from form or user profile
   */
  private getMobileNumber(): string {
    return (
      this.sendTextEmailForm.value.userMobile ?? this.userProfile?.mobile ?? ''
    );
  }

  /**
   * Add reply text to message
   * @param message - Current message
   * @param mobile - Mobile number
   * @returns Updated message with reply text
   */
  private addReplyText(message: string, mobile: string): string {
    if (!mobile) return message;
    const replyText = `To reply ${mobile}`;
    if (message.includes(replyText)) return message;
    return `${message} ${replyText}`.trim();
  }

  /**
   * Remove reply text from message
   * @param message - Current message
   * @param mobile - Mobile number
   * @returns Updated message without reply text
   */
  private removeReplyText(message: string, mobile: string): string {
    const replyText = `To reply ${mobile}`;
    return message.replace(replyText, '').trim();
  }

  /**
   * Add short URL to message
   * @param message - Current message
   * @param url - Short URL to add
   * @returns Updated message with URL
   */
  private addShortUrl(message: string, url: string): string {
    if (!url || message.includes(url)) return message;
    return `${message} ${url}`.trim();
  }

  /**
   * Remove short URL from message
   * @param message - Current message
   * @param url - Short URL to remove
   * @returns Updated message without URL
   */
  private removeShortUrl(message: string, url: string): string {
    return message.replace(url, '').trim();
  }

  /**
   * Cleanup subscriptions on component destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
