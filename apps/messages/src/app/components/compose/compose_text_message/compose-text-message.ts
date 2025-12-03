import {
  ISignUpItem,
  ISubAdmin,
  IGroupItem,
  MessageStatus,
  SentTo,
  SendToType,
  ICreateMessageRequest,
  IMessagePreviewRequest,
  MessageResponse,
  ISaveDraftMessagePayload,
  IRecipientsResponseData,
  IMessageByIdDataExtended,
  IRecipient,
  IGroupMemberDto,
  IGroupInfoDto,
  IGroupMember,
  SignUPType,
  EXCLUDED_RECIPIENT_VALUES,
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
  DialogConfig,
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
import { Subject, takeUntil, switchMap, of, catchError, tap } from 'rxjs';
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
import { ActivatedRoute, Router } from '@angular/router';
import {
  mapApiToSelectedValue,
  extractPeopleSelectionData,
  mapSelectedValueToApi,
  stripHtml,
  buildPeopleSelectionData,
  applyBackendWorkarounds,
  getLabelForSelectedValue,
  saveDraftMessage,
  handleDraftLoadError,
  initializeDraftEditMode,
} from '../../utils/services/draft-message.util';
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
    SugUiLoadingSpinnerComponent,
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
  private toastr = inject(ToastrService);
  stateService = inject(ComposeEmailStateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
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
  isEditingExistingDraft = false;
  currentDraftMessageId: number | null = null;
  originalSendAsText: boolean | undefined;
  originalSendAsEmail: boolean | undefined;
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
  selectedCustomUserIds: string[] = [];
  currentSendToType = '';
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

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const messageId = Number(params['id']);

        if (!isNaN(messageId) && messageId > 0) {
          this.getMessageById(messageId);
        }
      });
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
    return this.selectedValue === 'emailoptionone'
      ? this.inviteTextForm
      : this.sendTextEmailForm;
  }

  get currentFormType(): 'inviteToSignUp' | 'emailParticipants' {
    return this.selectedValue === 'emailoptionone'
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
    this.onSaveDraft(MessageStatus.SCHEDULED, undefined, event);
  }

  onSaveDraft(
    status: MessageStatus,
    formType?: 'inviteToSignUp' | 'emailParticipants',
    date?: string
  ): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const messageId = Number(params['id']);

        if (!isNaN(messageId) && messageId > 0) {
          const form =
            formType === 'inviteToSignUp'
              ? this.inviteTextForm
              : this.sendTextEmailForm;

          const formValue = form.getRawValue();

          if (formType === 'inviteToSignUp') {
            const toValue = this.inviteTextForm.get('to')?.value;
            if (!toValue || toValue.length === 0) {
              this.toastr.error(
                'Please select recipients in the "To" field',
                'Validation Error'
              );
              return;
            }
          } else {
            const peopleSelectionData = this.stateService.peopleSelectionData;
            if (!peopleSelectionData.selectedValue) {
              this.toastr.error(
                'Please select recipients in the "To" field',
                'Validation Error'
              );
              return;
            }
          }

          const peopleSelectionData = this.stateService.peopleSelectionData;

          let sentto: string;
          let sendtotype: string;

          const hasSelectedMemberGroups =
            this.stateService.selectedMemberGroups.length > 0;

          if (formType === 'inviteToSignUp') {
            sendtotype = 'peopleingroups';
            sentto = 'all';
          } else if (
            this.isEditingExistingDraft &&
            this.currentSendToType.toLowerCase() === 'custom' &&
            hasSelectedMemberGroups
          ) {
            sendtotype = 'custom';
            sentto = 'members';
          } else if (
            this.isEditingExistingDraft &&
            this.currentSendToType.toLowerCase() === 'custom' &&
            this.selectedCustomUserIds.length > 0
          ) {
            sendtotype = 'custom';
            sentto = this.selectedCustomUserIds.join(',');
          } else {
            const mapped = mapSelectedValueToApi(
              peopleSelectionData.selectedValue || '',
              peopleSelectionData.includeNonGroupMembers
              // || peopleSelectionData.includeNonGroupMembersForPeople
            );
            sentto = mapped.sentto;
            sendtotype = mapped.sendtotype;
          }

          const messagetypeid = formType === 'inviteToSignUp' ? 14 : 15;

          const payload: ISaveDraftMessagePayload = {
            subject: formValue.subject || formValue.emailSubject,
            body: formValue.message || '',
            sentto: sentto,
            sendtotype: sendtotype,
            messagetypeid: messagetypeid,
            status: 'draft',
            sendastext:
              this.isEditingExistingDraft &&
              this.originalSendAsText !== undefined
                ? this.originalSendAsText
                : true,
            sendasemail:
              this.isEditingExistingDraft &&
              this.originalSendAsEmail !== undefined
                ? this.originalSendAsEmail
                : false,
          };

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
          } else if (formValue.replyTo) {
            const replyToArray = Array.isArray(formValue.replyTo)
              ? formValue.replyTo
              : [formValue.replyTo];
            if (replyToArray.length > 0) {
              payload.replytoids = replyToArray.map((r: any) =>
                parseInt(r, 10)
              );
            }
          }

          if (formValue.fromName) {
            payload.contactname = formValue.fromName;
          }

          if (formValue.themeid) {
            payload.themeid = formValue.themeid;
          }

          if (formValue.attachments && formValue.attachments.length > 0) {
            payload.attachmentids = formValue.attachments;
          }

          const sendtotypeLower = sendtotype.toLowerCase();

          if (this.stateService.selectedSignups.length > 0) {
            payload.signupids = this.stateService.selectedSignups.map(
              (s) => s.signupid
            );
          }

          if (formType === 'inviteToSignUp') {
            const toValue = this.inviteTextForm.get('to')?.value;
            if (toValue && toValue.length > 0) {
              payload.groupids = toValue.map((id: string) => parseInt(id, 10));
            } else {
              payload.groupids = [];
            }
          } else {
            const groupIds = this.stateService.selectedGroups
              .map((g) => parseInt(g.value, 10))
              .filter((id) => !isNaN(id));
            payload.groupids = groupIds.length > 0 ? groupIds : [];
          }

          if (messagetypeid === 15 && sendtotypeLower === 'peopleingroups') {
            if (formType === 'inviteToSignUp') {
              const toValue = this.inviteTextForm.get('to')?.value;
              if (toValue && toValue.length > 0) {
                if (!payload.groupids) {
                  payload.groupids = toValue.map((id: string) =>
                    parseInt(id, 10)
                  );
                }
                payload.groups = toValue.map((id: string) => {
                  const groupData = this.grooupApiResponse.find(
                    (g) => g.id === parseInt(id, 10)
                  );
                  return {
                    groupid: parseInt(id, 10),
                    groupname: groupData?.title || 'Unknown Group',
                  };
                });
              }
            } else if (this.stateService.selectedGroups.length > 0) {
              const groupIds = this.stateService.selectedGroups
                .map((g) => parseInt(g.value, 10))
                .filter((id) => !isNaN(id));

              if (groupIds.length > 0 && !payload.groupids) {
                payload.groupids = groupIds;
              }

              payload.groups = this.stateService.selectedGroups
                .map((g) => {
                  const groupId = parseInt(g.value, 10);
                  if (isNaN(groupId)) return null;
                  const groupData = this.grooupApiResponse.find(
                    (gr) => gr.id === groupId
                  );
                  return {
                    groupid: groupId,
                    groupname: groupData?.title || g.label,
                  };
                })
                .filter((g) => g !== null);
            }
          }

          if (
            sendtotypeLower === 'custom' &&
            peopleSelectionData.manualEmails
          ) {
            const emails = peopleSelectionData.manualEmails
              .split(/[,\n]/)
              .map((email: string) => email.trim())
              .filter((email: string) => email.length > 0);

            payload.to = emails.map((email: string) => ({
              email: email,
              isgroupemail: false,
            }));
          }

          if (
            sendtotypeLower === 'specificdateslot' &&
            this.stateService.selectedDateSlots.length > 0
          ) {
            payload.slotids = this.stateService.selectedDateSlots.map((slot) =>
              slot.slotitemid.toString()
            );

            if (messagetypeid === 15) {
              payload.sendToGroups = this.stateService.selectedDateSlots.map(
                (slot) => ({
                  id: 'slot_' + slot.slotitemid,
                  isWaitlistedRow: slot.waitlist || false,
                })
              );
            }
          }

          if (sendtotypeLower === 'specificrsvp') {
            const responses: string[] = [];
            if (peopleSelectionData.rsvpResponseyes) responses.push('yes');
            if (peopleSelectionData.rsvpResponseno) responses.push('no');
            if (peopleSelectionData.rsvpResponsemaybe) responses.push('maybe');
            if (peopleSelectionData.rsvpResponsenoresponse)
              responses.push('nr');

            if (responses.length > 0) {
              payload.sentto = `rsvp:${responses.join(',')}`;
            }
          }

          if (sendtotypeLower === 'custom' && hasSelectedMemberGroups) {
            payload.to = this.stateService.selectedMemberGroups.map(
              (member) => ({
                memberid: member.id,
                firstname: member.firstname || '',
                lastname: member.lastname || '',
                email: member.email || '',
              })
            );
          }

          this.saveDraftToApi(messageId, payload);
        } else {
          // Creating new draft - you'll need to implement POST /v3/messages endpoint
          // this.toastr.error('Message ID not found. Cannot save draft.', 'Error');

          // this.isLoading = true;
          // const form = this.currentEmailForm.value;

          // // Only extract numeric group IDs, filtering out non-numeric values like 'sendMessagePeopleIselect'
          // const groups = form.to
          //   ? form.to
          //       .map(
          //         (g: string | { label: string; value: string | number }) => {
          //           if (typeof g === 'object' && g !== null && 'value' in g) {
          //             return parseInt(String(g.value), 10);
          //           }
          //           return parseInt(String(g), 10);
          //         }
          //       )
          //       .filter((id: number) => !isNaN(id))
          //   : this.stateService.selectedGroups
          //       .map((g) => parseInt(g.value, 10))
          //       .filter((id: number) => !isNaN(id));

          // const payload: ICreateMessageRequest = {
          //   subject: form.subject || form.emailSubject,
          //   body: form.message,
          //   sentto: SentTo.PEOPLE_IN_GROUPS,
          //   sendtotype: SendToType.ALL,
          //   status: status,
          //   messagetypeid: this.selectedValue === 'emailoptionone' ? 14 : 15,
          //   sendasemail: form.includefallback === true,
          //   sendastext: true,
          //   themeid: form.themeid,
          //   contactname: form.fromName || form.emailFrom,
          //   replytoids: this.filterReplyToAdmins(
          //     form.replyTo ?? form.emailReplyTo,
          //     'id'
          //   ) as number[],
          //   signupids: form.selectedSignups
          //     ?.map((signup: string | number | { value: string | number }) => {
          //       if (
          //         typeof signup === 'object' &&
          //         signup !== null &&
          //         'value' in signup
          //       ) {
          //         return parseInt(String(signup.value), 10);
          //       }
          //       return parseInt(String(signup), 10);
          //     })
          //     .filter((id: number) => !isNaN(id)),
          //   groupids: groups,
          // };
          // if (date) {
          //   payload.senddate = date;
          // }

          // // Handle radio selection logic
          // switch (this.selectedRadioOption.selectedValue) {
          //   case 'peopleingroups':
          //   case 'sendMessagePeopleRadio':
          //     payload.sendtotype = SendToType.PEOPLE_IN_GROUPS;
          //     payload.sentto = SentTo.ALL;
          //     payload.groupids = this.stateService.selectedGroups.map((g) =>
          //       parseInt(g.value)
          //     );
          //     break;

          //   case 'ManuallyEnterEmail': {
          //     const emailsString = this.selectedRadioOption.recipients[0] || '';
          //     const aliasString = this.selectedRadioOption.recipients[1] || '';

          //     // Convert comma-separated string to array of email objects
          //     payload.to = emailsString
          //       ? emailsString
          //           .split(',')
          //           .map((email: string) => email.trim())
          //           .filter((email: string) => email)
          //           .map((email: string) => ({
          //             email: email,
          //           }))
          //       : [];

          //     // Convert comma-separated alias string to array
          //     payload.alias = aliasString
          //       ? aliasString
          //           .split(',')
          //           .map((email: string) => email.trim())
          //           .filter((email: string) => email)
          //       : [];

          //     payload.sendtotype = SendToType.CUSTOM;
          //     payload.sentto = SentTo.MANUAL;
          //     break;
          //   }

          //   case 'specificRsvpResponse':
          //     payload.sendtotype = SendToType.SPECIFIC_RSVP_RESPONSE;
          //     payload.sentto = `rsvp:${this.selectedRadioOption.recipients.join(
          //       ','
          //     )}`;
          //     payload.groupids = [];
          //     break;

          //   case 'peopleWhoSignedUp':
          //     payload.sendtotype = SendToType.SIGNED_UP;
          //     payload.sentto = SentTo.SIGNED_UP;
          //     payload.groupids = [];
          //     break;

          //   case 'peopleOnWaitlist':
          //     payload.sendtotype = SendToType.WAITLIST;
          //     payload.sentto = SentTo.SIGNED_UP;
          //     payload.groupids = [];
          //     break;

          //   case 'peopleSignedUpAndWaitlist':
          //     payload.sendtotype = SendToType.SIGNUP_WAITLIST;
          //     payload.sentto = SentTo.SIGNED_UP;
          //     payload.groupids = [];
          //     break;

          //   case 'peopleWhoNotSignedUp':
          //     payload.sendtotype = SendToType.PEOPLE_IN_GROUPS;
          //     payload.sentto = SentTo.NOT_SIGNED_UP;
          //     payload.groupids = [];
          //     break;

          //   case 'sendMessagePeopleIselect':
          //     if (this.selectedRadioOption.fromCustomGroup === true) {
          //       payload.sendtotype = SendToType.CUSTOM;
          //       payload.sentto = SentTo.MEMBERS;
          //       payload.to = this.selectedRadioOption.recipients.map(
          //         (slot) => ({
          //           memberid: slot.id,
          //           firstname: slot.firstname,
          //           lastname: slot.lastname,
          //           email: slot.email,
          //         })
          //       );
          //     } else {
          //       payload.sendtotype = SendToType.SPECIFIC_DATE_SLOT;
          //       payload.sentto = SentTo.ALL;
          //       payload.groupids = [];
          //       payload.slotids = this.selectedRadioOption.recipients
          //         .filter(
          //           (slot): slot is { slotitemid: number; waitlist: boolean } =>
          //             typeof slot === 'object' &&
          //             slot !== null &&
          //             'slotitemid' in slot &&
          //             'waitlist' in slot
          //         )
          //         .map((slot) => 'slot_' + slot.slotitemid);
          //       payload.sendToGroups = this.selectedRadioOption.recipients
          //         .filter(
          //           (slot): slot is { slotitemid: number; waitlist: boolean } =>
          //             typeof slot === 'object' &&
          //             slot !== null &&
          //             'slotitemid' in slot &&
          //             'waitlist' in slot
          //         )
          //         .map((slot) => ({
          //           id: 'slot_' + slot.slotitemid,
          //           isWaitlistedRow: slot.waitlist,
          //         }));
          //     }
          //     break;
          // }

          // // Apply non-group members rule after switch (can override sentto)
          // if (this.selectedRadioOption.includeNonGroupMembers) {
          //   payload.sentto = SentTo.ALL_INCLUDE_NON_GROUP_MEMBERS;
          // }

          // this.composeService.createMessage(payload).subscribe({
          //   next: (response) => {
          //     if (response.success === true) {
          //       this.toastr.success('Message saved successfully', 'Success');
          //       this.showOptionsAgain();
          //     }
          //     this.isLoading = false;
          //   },
          //   error: (err) => {
          //     this.isLoading = false;
          //     this.toastr.error(err.error.message[0]?.details, 'Error');
          //     if (
          //       this.sendTextEmailForm.get('includefallback')?.value === true
          //     ) {
          //       this.onPreviewAndSend(this.currentEmailForm);
          //     }
          //   },
          // });
          this.isLoading = true;
          const form = this.currentEmailForm.value;

          // Only extract numeric group IDs, filtering out non-numeric values like 'sendMessagePeopleIselect'
          const groups = form.to
            ? form.to
                .map(
                  (g: string | { label: string; value: string | number }) => {
                    if (typeof g === 'object' && g !== null && 'value' in g) {
                      return parseInt(String(g.value), 10);
                    }
                    return parseInt(String(g), 10);
                  }
                )
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
                payload.to = this.selectedRadioOption.recipients.map(
                  (slot) => ({
                    memberid: slot.id,
                    firstname: slot.firstname,
                    lastname: slot.lastname,
                    email: slot.email,
                  })
                );
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
            payload.sentto = SentTo.ALL_INCLUDE_NON_GROUP_MEMBERS;
            payload.sendtotype = SendToType.PEOPLE_IN_GROUPS;
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
                  this.sendTextEmailForm.get('includefallback')?.value ===
                    true &&
                  status !== MessageStatus.DRAFT
                ) {
                  this.onPreviewAndSend(this.currentEmailForm);
                }
              },
            });
        }
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
      signuptype: SignUPType.SIGNUP,
      emailtype: this.selectedValue === 'emailoptionone' ? '14' : '15',
      themeid: form.value.themeid,
      signupids: this.getSelectedSignup().map((su) => su.signupid),
    };
    this.availableThemes = [
      1,
      ...this.signupOptionsData.map((su) => su.themeid),
    ];
    if (this.getSelectedSignup().length === 0) {
      payload.signuptype = SignUPType.ACCIDEX;
    }
    if (form.value.to && form.value.to.length > 0) {
      payload.sendto = form.value.to
        .filter(
          (person: ISelectOption) =>
            !EXCLUDED_RECIPIENT_VALUES.has(person.value as string)
        )
        .map((person: string | { label: string; value: string | number }) => {
          // Handle case where person is just a string (like '37826')
          if (typeof person === 'string') {
            return {
              id: Number(person),
              displayname: person,
              ischecked: true,
              membercount: this.stateService.recipients.length,
            };
          }
          // Handle case where person is an object with label and value
          return {
            id: Number(person.value),
            displayname: person.label,
            ischecked: true,
            membercount: this.stateService.recipients.length,
          };
        });
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
    this.inviteTextForm = this.fb.group({
      fromName: ['', Validators.required],
      replyTo: [[]],
      subject: ['', Validators.required],
      message: ['', Validators.required],
      token: ['', Validators.required],
      to: [[]],
      themeid: [1],
    });

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
      emailReplyTo: [[]],
      toPeople: [{ value: [], disabled: true }],
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

  getMessageById(id: number) {
    this.isLoading = true;

    type ReplyToItem = { memberid: number; email: string };

    const optionOne = 14;
    const optionTwo = 15;

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

          if (response.data.messagetypeid == optionOne) {
            this.selectedValue = 'emailoptionone';

            this.showRadioButtons = false;

            this.loadUserProfile();

            const replyToMemberIds = (
              (response.data.replyto as ReplyToItem[]) || []
            ).map((item) => String(item.memberid));

            this.inviteTextForm.get('to')?.enable();

            this.inviteTextForm.patchValue({
              subject: response.data.subject,
              message: stripHtml(response.data.body),
            });

            setTimeout(() => {
              this.inviteTextForm.get('replyTo')?.setValue(replyToMemberIds);
              this.inviteTextForm.get('replyTo')?.updateValueAndValidity();
            }, 0);

            this.restorePeopleSelection(
              response.data.sentto,
              response.data.sendtotype
            );

            const skipGroupRestoration =
              (response.data.sendtotype?.toLowerCase() === 'signedup' &&
                response.data.sentto?.toLowerCase() === 'signedup') ||
              (response.data.sendtotype?.toLowerCase() === 'peopleingroups' &&
                response.data.sentto?.toLowerCase() === 'notsignedup');

            if (skipGroupRestoration) {
              const signupIds = this.stateService.selectedSignups.map(
                (s) => s.signupid
              );
              this.composeService
                .fetchRecipients({
                  sentToType: response.data.sendtotype,
                  sentTo: response.data.sentto,
                  messageTypeId: 14,
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
          } else if (response.data.messagetypeid == optionTwo) {
            this.selectedValue = 'emailoptiontwo';

            this.showRadioButtons = false;

            this.loadUserProfile();

            const replyToMemberIds = (
              (response.data.replyto as ReplyToItem[]) || []
            ).map((item) => String(item.memberid));

            const isRsvpSignup =
              response.data.sendtotype?.toLowerCase() === 'specificrsvp' ||
              response.data.sendtotype?.toLowerCase() ===
                'specificrsvpresponse';

            const mappedSignups: ISignUpItem[] = (
              response.data?.signups || []
            ).map((s: any) => ({
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

            this.stateService.setSelectedSignups(mappedSignups, true);

            this.sendTextEmailForm.get('toPeople')?.enable();

            this.sendTextEmailForm.patchValue({
              emailSubject: response.data.subject,
              selectedSignups: mappedSignups.map((s) => s.signupid.toString()),
              message: stripHtml(response.data.body),
            });

            setTimeout(() => {
              this.sendTextEmailForm
                .get('emailReplyTo')
                ?.setValue(replyToMemberIds);
              this.sendTextEmailForm
                .get('emailReplyTo')
                ?.updateValueAndValidity();
            }, 0);

            this.restorePeopleSelection(
              response.data.sentto,
              response.data.sendtotype
            );

            if (
              response.data.sendtotype?.toLowerCase() === 'specificdateslot' &&
              response.data.sentto &&
              response.data.signups &&
              response.data.signups.length > 0
            ) {
              this.restoreDateSlots(
                response.data.sentto,
                response.data.signups
              );
            }

            const skipGroupRestoration =
              (response.data.sendtotype?.toLowerCase() === 'signedup' &&
                response.data.sentto?.toLowerCase() === 'signedup') ||
              (response.data.sendtotype?.toLowerCase() === 'peopleingroups' &&
                response.data.sentto?.toLowerCase() === 'notsignedup');

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

            if (
              response.data.sendtotype?.toLowerCase() === 'custom' &&
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
                      (item: IGroupMemberDto) =>
                        memberIds.includes(item.member.id)
                    );

                    const matchedMembers = allGroupsResponse.data
                      .filter((item: IGroupMemberDto) =>
                        memberIds.includes(item.member.id)
                      )
                      .map((item: IGroupMemberDto) => ({
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
                    selectedMemberData.forEach((item: IGroupMemberDto) => {
                      item.groups?.forEach((group: IGroupInfoDto) => {
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
                        sentToType: 'peopleingroups',
                        sentTo: 'all',
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
                  messageTypeId: 15,
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

                      // For messageTypeId 15, calculate separate email and text recipient counts
                      this.textRecipientsCount = data.recipients.filter(
                        (r) => r.smsoptin === true
                      ).length;
                      this.emailRecipientsCount = data.recipients.filter(
                        (r) => r.email && r.email.trim().length > 0
                      ).length;
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
          } else {
            this.isLoading = false;

            this.isEditingExistingDraft = false;
            this.currentDraftMessageId = null;
            this.stateService.setDraftEditMode(false);

            this.toastr.error(
              `This message type (${response.data.messagetypeid}) cannot be edited in this form.`,
              'Unsupported Message Type'
            );
            this.router.navigate(['/messages/compose']);
          }
        },

        error: (error) => {
          this.isLoading = false;
          console.error('Failed to load message', error);

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

    this.stateService.setPeopleSelectionData(peopleSelectionData);

    this.selectedRadioOption = {
      selectedValue: selectedValue,
      includeNonGroupMembers: additionalData.includeNonGroupMembers || false,
      recipients: [],
    };

    this.currentSendToType = sendtotype;

    if (sendtotype.toLowerCase() === 'specificdateslot') {
      return;
    }

    const label = getLabelForSelectedValue(selectedValue);
    this.stateService.setSelectedGroups([
      {
        label: label,
        value: selectedValue,
      },
    ]);
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
      },
      onLoadingChange: (isLoading) => {
        this.isLoading = isLoading;
      },
    });
  }

  /**
   * Restore groups selection and fetch recipient count
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

    const currentForm =
      this.selectedValue === 'emailoptionone'
        ? this.inviteTextForm
        : this.sendTextEmailForm;

    const toFieldName =
      this.selectedValue === 'emailoptionone' ? 'to' : 'toPeople';

    if (this.selectedValue === 'emailoptionone') {
      const groupValues = groupOptions.map((g) => g.value);
      currentForm.patchValue({ [toFieldName]: groupValues });
    } else {
      currentForm.patchValue({ [toFieldName]: groupOptions });
    }

    const signupIds = this.stateService.selectedSignups.map((s) => s.signupid);
    const groupIds = groups.map((g) => g.groupid);

    const messageTypeId = this.selectedValue === 'emailoptionone' ? 14 : 15;

    const existingPeopleSelectionData =
      this.stateService.peopleSelectionData || {};
    const updatedPeopleSelectionData = {
      ...existingPeopleSelectionData,
      selectedValue:
        messageTypeId === 14 ? 'peopleingroups' : 'sendMessagePeopleRadio',
      selectedGroups: groupIds.map((id) => id.toString()),
    };
    this.stateService.setPeopleSelectionData(updatedPeopleSelectionData);

    if (
      messageTypeId === 14 &&
      sendtotype.toLowerCase() === 'peopleingroups' &&
      signupIds.length === 0
    ) {
      this.stateService.setRecipientCount(groups.length);
      return;
    }

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
          const data = response.data as any;
          if (Array.isArray(data.recipients)) {
            const recipientCount = data.recipients.length;
            const recipients = data.recipients;

            this.stateService.setRecipientCount(recipientCount);
            this.stateService.setRecipients(recipients);

            // For messageTypeId 15, calculate separate email and text recipient counts
            if (messageTypeId === 15) {
              this.textRecipientsCount = recipients.filter(
                (r: any) => r.smsoptin === true
              ).length;
              this.emailRecipientsCount = recipients.filter(
                (r: any) => r.email && r.email.trim().length > 0
              ).length;
            }
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

  private isRestoringDateSlots = false;

  /**
   * Restore date slots when loading a draft with specificdateslot sendtotype
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
                const matches = slotIds.includes(slotIdStr);
                return matches;
              });

              allDateSlots.push(...matchingSlots);
            }

            completedRequests++;
            if (completedRequests === signups.length) {
              if (allDateSlots.length > 0) {
                this.stateService.setSelectedDateSlots(allDateSlots);

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
                  this.selectedValue === 'textoptionone' ? 14 : 15;

                this.composeService
                  .fetchRecipients({
                    sentToType: 'specificdateslot',
                    sentTo: 'specificdateslot',
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

                        // For messageTypeId 15, calculate separate email and text recipient counts
                        if (messageTypeId === 15) {
                          this.textRecipientsCount = data.recipients.filter(
                            (r) => r.smsoptin === true
                          ).length;
                          this.emailRecipientsCount = data.recipients.filter(
                            (r) => r.email && r.email.trim().length > 0
                          ).length;
                        }
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
