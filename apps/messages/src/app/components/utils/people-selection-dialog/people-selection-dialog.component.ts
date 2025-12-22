import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  ChangeDetectorRef,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  SugUiRadioCheckboxButtonComponent,
  SugUiDialogComponent,
  SugUiButtonComponent,
  SugUiMultiSelectDropdownComponent,
  DialogConfig,
  ISelectOption,
} from '@lumaverse/sug-ui';
import { ComposeService } from '../../compose/compose.service';
import { UserStateService } from '@services/user-state.service';
import { InputTextModule } from 'primeng/inputtext';
import { ChipModule } from 'primeng/chip';
import { ToastrService } from 'ngx-toastr';
import { SugUpdateGroupSectionComponent } from '../update-group-section/update-group-section.component';
import { Subject, takeUntil } from 'rxjs';
import {
  ISelectPortalOption,
  MemberProfile,
  SendToType,
  SentTo,
} from '@services/interfaces';
import { IMemberInfoDto } from '@services/interfaces';
import { SugInformationDialogComponent } from '../information-dialog/information-dialog.component';
import { CloudSpongeService } from '@services/cloudsponge.service';

@Component({
  selector: 'sug-people-selection-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SugUiRadioCheckboxButtonComponent,
    SugUiDialogComponent,
    SugUiButtonComponent,
    SugUiMultiSelectDropdownComponent,
    InputTextModule,
    ChipModule,
    SugUpdateGroupSectionComponent,
    SugInformationDialogComponent,
  ],
  templateUrl: './people-selection-dialog.component.html',
  styleUrls: [
    '../../compose/compose_email/compose-email.scss',
    './people-selection-dialog.component.scss',
  ],
  encapsulation: ViewEncapsulation.None,
})
export class PeopleSelectionDialogComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() visible = false;
  @Input() formType: 'inviteToSignUp' | 'emailParticipants' = 'inviteToSignUp';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() selectedSignups: any[] = [];
  @Input() isSignUpIndexPageSelected = false;
  @Input() isFromTextMessage = false;
  @Input() isTextMessageParticipants = false;

  @Input() selectedPortalPages: ISelectPortalOption[] = [];
  @Input() selectedTabGroups: any[] = [];
  @Input() groupOptions: ISelectOption[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() selectedDateSlots: any[] = [];
  @Input() recipientCount = 0;
  @Input() messageTypeId = 4;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() peopleSelectionData: any = {};
  @Input() sendtotype = '';
  @Input() selectedCustomUserIds: string[] = [];
  @Input() selectedMemberGroups: IMemberInfoDto[] = [];
  @Input() hasWaitlistSlots = false;
  @Input() selectedGroups: ISelectOption[] = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() peopleSelected = new EventEmitter<void>();
  @Output() openDateSlotsDialog = new EventEmitter<void>();
  @Output() selectedGroupsChange = new EventEmitter<ISelectOption[]>();
  @Output() selectedRadioOption = new EventEmitter<{
    selectedValue: string;
    includeNonGroupMembers: boolean;
    fromCustomGroup?: boolean;
    recipients: any[];
  }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Output() recipientsChange = new EventEmitter<any[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Output() selectedDateSlotsChange = new EventEmitter<any[]>();
  @Output() recipientCountChange = new EventEmitter<number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Output() peopleSelectionDataChange = new EventEmitter<any>();
  @Output() removeSlot = new EventEmitter<number>();
  private readonly destroy$ = new Subject<void>();
  private userProfile: MemberProfile | null = null;
  @Output() removeMemberGroup = new EventEmitter<number>();
  @Output() openMyGroupDialog = new EventEmitter<void>();
  @Output() selectedMemberGroupsChange = new EventEmitter<IMemberInfoDto[]>();

  private toastr = inject(ToastrService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private composeService = inject(ComposeService);
  private userStateService = inject(UserStateService);
  cloudSpongeService = inject(CloudSpongeService);

  infoDialog = false;
  infoMessage = '';

  groupDialogVisible = false;
  peopleDialogForm!: FormGroup;
  isLoading = false;
  private skipNextRadioChange = false; // Flag to skip the next radio change event
  private skipAliasReset = false; // Flag to skip alias reset during restoration

  dialogConfig: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: false,
    dismissableMask: false,
    visible: this.visible,
    appendTo: 'body',
    position: 'center',
    width: '800px',
    contentStyleClass: 'dialog-overflow-visible',
  };

  get isWaitlistEligible(): boolean {
    if (!this.userProfile?.ispro) {
      return false;
    }
    const productCode =
      this.userProfile?.subscription?.productcode?.toUpperCase() || '';
    return !productCode.includes('SILVER');
  }

  // Form One radio options
  get formOneRadioOptions() {
    const options = [
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

    // Add "People I will select" option when sendtotype is "custom"
    if (this.sendtotype?.toLowerCase() === 'custom') {
      options.push({
        label: 'People I will select',
        value: 'sendMessagePeopleIselect',
        hasCustomContent: true,
      });
    }

    return options;
  }

  // Form Two radio options
  get formTwoRadioOptions() {
    const selectedSignups = this.selectedSignups;

    const hasRsvpSignup = selectedSignups.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (signup: any) => signup.mode?.toLowerCase() === 'rsvp'
    );

    const isEligible = this.isWaitlistEligible;
    const hasSelectedSignups = selectedSignups.length > 0;

    // 1. Enabled Waitlist Options (Gold+ with slots OR Text Message)
    if (
      (this.hasWaitlistSlots &&
        this.formType === 'emailParticipants' &&
        isEligible) ||
      (this.isFromTextMessage && isEligible)
    ) {
      return this.getWaitlistOptions(false);
    }

    // 2. Disabled Waitlist Options (Basic/Silver - Priority over RSVP)
    // Always show disabled waitlist options for ineligible users in emailParticipants mode (Email or Text)
    if (
      (this.formType === 'emailParticipants' ||
        this.isTextMessageParticipants) &&
      !isEligible &&
      hasSelectedSignups
    ) {
      return this.getWaitlistOptions(true);
    }

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

    // If Sign Up Index Page is selected, show only group and manual options
    if (this.isSignUpIndexPageSelected) {
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

    // If tab groups are selected, show only group and manual options
    if (this.selectedTabGroups.length > 0) {
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

    // Default: show all options for regular signups
    return [
      {
        label: 'People who have signed up',
        value: 'peopleWhoSignedUp',
      },
      {
        label: 'People who have NOT signed up',
        value: 'peopleWhoNotSignedUp',
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

  // Helper to get waitlist options
  private getWaitlistOptions = (disabled: boolean) => [
    {
      label: 'People who have signed up',
      value: 'peopleWhoSignedUp',
    },
    {
      label: 'People who are on a waitlist',
      value: 'peopleOnWaitlist',
      disabled: disabled,
      isPro: disabled,
    },
    {
      label: 'People who have signed up and people who are on a waitlist',
      value: 'peopleSignedUpAndWaitlist',
      disabled: disabled,
      isPro: disabled,
    },
    {
      label: 'People who have NOT signed up',
      value: 'peopleWhoNotSignedUp',
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

  nonGroupMemberOption = [
    {
      label: 'Also include people that signed up but are not in the group(s)',
      value: 'includenongroup',
    },
  ];

  groupAliasCheckboxOption = [
    { label: 'I need to enter a group email alias', value: 'usegroupalias' },
  ];

  rsvpResponseOptions = [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
    { label: 'Maybe', value: 'maybe' },
    { label: 'No Response', value: 'noresponse' },
  ];

  cloudSpongeServices = [
    'gmail',
    'icloud',
    'windowslive',
    'yahoo',
    'aol',
    'csv',
  ];

  get isStandardSignup(): boolean {
    // Check if the selected signup(s) are standard (not RSVP)
    const selectedSignups = this.selectedSignups;
    if (selectedSignups.length === 0) return false;

    // Return true only if ALL selected signups are NOT RSVP
    return selectedSignups.every(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (signup: any) => signup.mode?.toLowerCase() !== 'rsvp'
    );
  }

  get currentRadioOptions() {
    return this.formType === 'inviteToSignUp'
      ? this.formOneRadioOptions
      : this.formTwoRadioOptions;
  }

  async ngOnInit(): Promise<void> {
    this.userStateService.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.userProfile = profile;
        },
      });
    this.initializeForm();
    this.setupSingleSelectionEnforcement();

    // Initialize CloudSponge - don't block the UI, but ensure it's ready
    this.cloudSpongeService.initCloudSponge(['gmail']).catch((error) => {
      console.error('Failed to initialize CloudSponge in component:', error);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When visible changes from false to true, restore saved state OR reset form
    if (
      changes['visible'] &&
      changes['visible'].currentValue === true &&
      !changes['visible'].previousValue
    ) {
      // Defer form operations to avoid change detection errors
      setTimeout(() => {
        const savedData = this.peopleSelectionData;

        // Check if we should preserve recipient count (when editing slots or member groups)
        const shouldPreserveRecipientCount =
          (this.formType === 'emailParticipants' &&
            (this.selectedDateSlots.length > 0 ||
              this.selectedMemberGroups.length > 0)) ||
          (this.formType === 'inviteToSignUp' &&
            this.sendtotype?.toLowerCase() === 'custom' &&
            this.selectedMemberGroups.length > 0);

        // Set flag before reset if we're going to restore state with slots
        if (shouldPreserveRecipientCount) {
          this.skipNextRadioChange = true;
        }

        // Always reset the form first to ensure clean state
        if (this.peopleDialogForm) {
          // Extract values from selectedGroups for form reset
          const selectedGroupValues = (this.selectedGroups || [])
            .filter((group) => group && group.value != null)
            .map((group) => group.value);

          this.peopleDialogForm.reset({
            selectedValue: null,
            selectedGroups: selectedGroupValues,
            includeNonGroupMembers: false,
            manualEmails: '',
            manualEmailsGroup: [],
            useGroupAlias: false,
            groupEmailAlias: '',
            rsvpResponseyes: false,
            rsvpResponseno: false,
            rsvpResponsemaybe: false,
            rsvpResponsenoresponse: false,
          });

          // Force change detection after form reset to ensure dropdown reflects current values
          this.cdr.detectChanges();

          // Additional sync to ensure dropdown shows current selected groups
          setTimeout(() => {
            this.syncSelectedGroupsToForm();
          }, 0);

          // Only auto-select groups if there's NO saved state (first time opening)
          // Don't auto-select if user has already made a selection previously
          if (!savedData.selectedValue) {
            const autoSelectedGroups =
              this.selectedSignups.length === 1 &&
              this.selectedSignups[0].communityid
                ? [this.selectedSignups[0].communityid.toString()]
                : [];

            if (autoSelectedGroups.length > 0) {
              setTimeout(() => {
                // Auto-select the appropriate radio option based on form type
                const autoRadioValue =
                  this.formType === 'inviteToSignUp'
                    ? 'peopleingroups'
                    : 'sendMessagePeopleRadio';

                // Set both radio option and groups
                this.skipNextRadioChange = true; // Skip the onRadioChange to prevent clearing our selection
                this.peopleDialogForm.patchValue({
                  selectedValue: autoRadioValue,
                  selectedGroups: autoSelectedGroups,
                });
                this.cdr.markForCheck();
              }, 100);
            }
          }
        }

        // If date slots or member groups are selected and form is formTwo, auto-select "People I will select"
        if (shouldPreserveRecipientCount && this.peopleDialogForm) {
          // Keep flag set to skip the next radio change event too
          this.skipNextRadioChange = true;
          // Use emitEvent: false to prevent triggering onRadioChange
          this.peopleDialogForm.patchValue(
            {
              selectedValue: 'sendMessagePeopleIselect',
            },
            { emitEvent: false }
          );
          // Manually trigger change detection to update the view
          this.cdr.detectChanges();
        }
        // Only restore if there's a valid saved state AND we're not preserving slots/members
        else if (
          savedData.selectedValue &&
          this.peopleDialogForm &&
          !shouldPreserveRecipientCount
        ) {
          // Set flag to skip the radio change event
          this.skipNextRadioChange = true;
          // Set flag to skip alias reset if useGroupAlias is true in saved data
          if (savedData.useGroupAlias) {
            this.skipAliasReset = true;
          }
          // Restore form state - patch all values at once
          this.peopleDialogForm.patchValue(savedData);
          // Manually trigger change detection to update the view
          this.cdr.detectChanges();
        }
      }, 0);
    }

    // Handle selectedGroups changes with proper error handling
    if (changes['selectedGroups'] && this.peopleDialogForm) {
      // Defer to next tick to avoid change detection issues
      Promise.resolve().then(() => {
        this.syncSelectedGroupsToForm();
      });
    }
  }

  private syncSelectedGroupsToForm(): void {
    try {
      if (!this.peopleDialogForm || !this.selectedGroups) {
        return;
      }

      // Extract values with proper error handling
      const selectedGroupValues = this.selectedGroups
        .filter((group): group is ISelectOption =>
          Boolean(group && group.value != null)
        )
        .map((group) => group.value);

      const selectedGroupsControl = this.peopleDialogForm.get('selectedGroups');
      if (!selectedGroupsControl) {
        return;
      }

      const currentFormValues = selectedGroupsControl.value || [];

      // Use proper array comparison instead of JSON.stringify
      const valuesChanged = !this.arraysEqual(
        selectedGroupValues,
        currentFormValues
      );

      if (valuesChanged) {
        // Update form control without aggressive change detection
        selectedGroupsControl.setValue(selectedGroupValues, {
          emitEvent: false,
        });

        // Only trigger change detection once
        this.cdr.markForCheck();

        // Handle recipient recalculation if needed
        this.handleRecipientRecalculation();
      }
    } catch (error) {
      console.error('Error syncing selected groups to form:', error);
      // Fallback: reset form to safe state
      this.resetFormToSafeState();
    }
  }

  private arraysEqual(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  }

  private handleRecipientRecalculation(): void {
    const currentRadioValue =
      this.peopleDialogForm?.get('selectedValue')?.value;

    if (
      currentRadioValue === 'peopleingroups' ||
      currentRadioValue === 'sendMessagePeopleRadio'
    ) {
      if (this.selectedGroups?.length > 0) {
        const groupIds = this.selectedGroups.map((group) => group.value);
        const includeNonGroupMembers =
          this.peopleDialogForm?.get('includeNonGroupMembers')?.value || false;

        // Use debounced calculation to prevent excessive API calls
        this.debouncedCalculateRecipients(groupIds, includeNonGroupMembers);
      } else {
        this.recipientCountChange.emit(0);
        this.recipientsChange.emit([]);
      }
    }
  }

  private debouncedCalculateRecipients = this.debounce(
    (groupIds: string[], includeNonGroupMembers: boolean) => {
      this.calculateRecipientCount(groupIds, includeNonGroupMembers);
    },
    300
  );

  private debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): T {
    let timeout: ReturnType<typeof setTimeout>;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  }

  private resetFormToSafeState(): void {
    if (this.peopleDialogForm) {
      const selectedGroupsControl = this.peopleDialogForm.get('selectedGroups');
      if (selectedGroupsControl) {
        selectedGroupsControl.setValue([], { emitEvent: false });
        this.cdr.markForCheck();
      }
    }
  }

  private initializeForm(): void {
    this.groupDialogVisible = false;
    this.peopleDialogForm = this.fb.group({
      selectedValue: [null, Validators.required],
      selectedGroups: [[]],
      includeNonGroupMembers: [false],
      manualEmails: [''],
      manualEmailsGroup: [[]],
      useGroupAlias: [false],
      groupEmailAlias: ['', Validators.email],
      rsvpResponseyes: [false],
      rsvpResponseno: [false],
      rsvpResponsemaybe: [false],
      rsvpResponsenoresponse: [false],
    });
  }

  private setupSingleSelectionEnforcement(): void {
    const selectedGroupsCtrl = this.peopleDialogForm.get('selectedGroups');
    const manualEmailsGroupCtrl =
      this.peopleDialogForm.get('manualEmailsGroup');

    if (selectedGroupsCtrl) {
      selectedGroupsCtrl.valueChanges.subscribe(
        (values: string[] | undefined) => {
          if (
            this.userStateService.isBasicUser(this.userProfile) &&
            Array.isArray(values) &&
            values.length > 1
          ) {
            const trimmed = [values[values.length - 1]];
            this.peopleDialogForm.patchValue(
              { selectedGroups: trimmed },
              { emitEvent: false }
            );
          }
        }
      );
    }

    if (manualEmailsGroupCtrl) {
      manualEmailsGroupCtrl.valueChanges.subscribe(
        (values: string[] | undefined) => {
          if (
            this.userStateService.isBasicUser(this.userProfile) &&
            Array.isArray(values) &&
            values.length > 1
          ) {
            const trimmed = [values[values.length - 1]];
            this.peopleDialogForm.patchValue(
              { manualEmailsGroup: trimmed },
              { emitEvent: false }
            );
          }
        }
      );
    }
  }

  closeDialog(cancelled: boolean): void {
    if (!cancelled) {
      const formValue = this.peopleDialogForm.value;
      const selectedValue = formValue.selectedValue;

      // Final enforcement of single selection for basic users before processing
      if (this.userStateService.isBasicUser(this.userProfile)) {
        if (
          Array.isArray(formValue.selectedGroups) &&
          formValue.selectedGroups.length > 1
        ) {
          formValue.selectedGroups = [
            formValue.selectedGroups[formValue.selectedGroups.length - 1],
          ];
          this.peopleDialogForm.patchValue({
            selectedGroups: formValue.selectedGroups,
          });
        }
      }

      // Validate that a radio option is selected
      if (!selectedValue) {
        this.openInfoDialog('Please select a recipient option.');
        // this.toastr.error('Please select a recipient option', 'Error');
        return;
      }

      if (
        selectedValue === 'peopleingroups' ||
        selectedValue === 'sendMessagePeopleRadio'
      ) {
        // Handle group selection
        const groupIds = formValue.selectedGroups || [];

        if (groupIds.length === 0) {
          this.openInfoDialog(
            'You must select a group from the dropdown list.'
          );
          // this.toastr.error('Please select at least one group', 'Error');
          return;
        }

        const selectedGroupOptions = this.groupOptions.filter((g) =>
          groupIds.includes(g.value)
        );
        // Check if "include non-group members" is selected
        // Handle both boolean and array formats from the checkbox component
        const includeNonGroupMembersValue = formValue.includeNonGroupMembers;

        // Convert to boolean - handle both true/false and array ['includenongroup']
        const includeNonGroupMembers = Array.isArray(
          includeNonGroupMembersValue
        )
          ? includeNonGroupMembersValue.length > 0
          : !!includeNonGroupMembersValue;

        // If includeNonGroupMembers is checked, show single label instead of group names
        if (includeNonGroupMembers) {
          // Create a single entry with combined label
          this.selectedGroupsChange.emit([
            {
              label: 'Group and non-group members who signed up',
              value: groupIds.join(','), // Store all group IDs in value
            },
          ]);
          this.selectedRadioOption.emit({
            selectedValue,
            includeNonGroupMembers,
            recipients: [],
          });
        } else {
          // Show actual group names when checkbox is not checked
          this.selectedGroupsChange.emit(selectedGroupOptions);
          this.selectedRadioOption.emit({
            selectedValue,
            includeNonGroupMembers,
            recipients: [],
          });
        }

        // Clear any previous recipients (e.g., from manual email entry)
        this.recipientsChange.emit([]);

        // Clear date slots when switching to group selection
        this.selectedDateSlotsChange.emit([]);
        this.selectedMemberGroupsChange.emit([]);

        // Calculate recipient count - this will set recipients from API
        // Pass the checkbox state for proper API payload
        this.calculateRecipientCount(groupIds, includeNonGroupMembers);
      } else if (selectedValue === 'ManuallyEnterEmail') {
        // Handle manual email entry
        const manualEmails = formValue.manualEmails || '';
        const groupEmailAlias = formValue.groupEmailAlias || '';
        // Parse emails from the manual entry textarea
        const manualEmailList = manualEmails
          .split(/[,\n]/)
          .map((email: string) => email.trim())
          .filter((email: string) => email.length > 0);

        // Parse alias emails separately
        const aliasEmailList = groupEmailAlias
          .split(/[,\n]/)
          .map((email: string) => email.trim())
          .filter((email: string) => email.length > 0);

        // Combine for validation and count
        const allEmails = [...manualEmailList, ...aliasEmailList];

        if (allEmails.length === 0) {
          // this.toastr.error('Please enter at least one email address', 'Error');
          this.openInfoDialog(
            'There are no emails defined. You must enter the emails manually or via import.'
          );
          return;
        }

        // Validate each email format
        const invalidEmails = allEmails.filter(
          (email: string) => !this.isValidEmail(email)
        );

        if (invalidEmails.length > 0) {
          // this.toastr.error(
          //   `The following email(s) are invalid:\n${invalidEmails.join(', ')}`,
          //   'Error'
          // );
          this.openInfoDialog(
            `The following email(s) are invalid:\n${invalidEmails.join(', ')}`
          );
          return;
        }

        this.selectedGroupsChange.emit([
          {
            label: 'Manual entry',
            value: 'manual_entry',
          },
        ]);
        this.recipientCountChange.emit(allEmails.length);
        // Store the emails as recipients for the recipient details dialog
        const recipients = allEmails.map((email: string) => ({ email }));
        this.recipientsChange.emit(recipients);

        // Pass manual emails as comma-separated string and alias as comma-separated string
        this.selectedRadioOption.emit({
          selectedValue,
          includeNonGroupMembers: false,
          recipients: [
            manualEmailList.join(', '), // Manual emails as comma-separated string
            aliasEmailList.join(', '), // Alias emails as comma-separated string
            formValue.manualEmailsGroup,
          ],
        });
        // Clear date slots when switching to manual entry
        this.selectedDateSlotsChange.emit([]);
        this.selectedMemberGroupsChange.emit([]);
      } else if (selectedValue === 'specificRsvpResponse') {
        // Handle RSVP response selection
        const responses = this.getSelectedRsvpResponses();

        if (responses.length === 0) {
          // this.toastr.error(
          //   'Please select at least one RSVP response',
          //   'Error'
          // );
          this.openInfoDialog('Please select at least one RSVP response.');
          return;
        }

        this.selectedGroupsChange.emit([
          {
            label: 'Specific RSVP Responses',
            value: 'specificRsvpResponse',
          },
        ]);
        this.selectedRadioOption.emit({
          selectedValue,
          includeNonGroupMembers: false,
          recipients: responses,
        });
        // Clear date slots when switching to RSVP selection
        this.selectedDateSlotsChange.emit([]);
        this.selectedMemberGroupsChange.emit([]);
        this.calculateRecipientCountForRsvp();
      } else if (selectedValue === 'peopleWhoSignedUp') {
        // People who have signed up
        this.selectedGroupsChange.emit([
          {
            label: 'People who have signed up',
            value: 'peopleWhoSignedUp',
          },
        ]);
        // Clear date slots when switching to signed up people
        this.selectedDateSlotsChange.emit([]);
        this.selectedMemberGroupsChange.emit([]);
        this.calculateRecipientCountForSignedUp();
        this.selectedRadioOption.emit({
          selectedValue,
          includeNonGroupMembers: false,
          recipients: [],
        });
      } else if (selectedValue === 'peopleOnWaitlist') {
        // People who are on a waitlist
        this.selectedGroupsChange.emit([
          {
            label: 'People who are on a waitlist',
            value: 'peopleOnWaitlist',
          },
        ]);
        // Clear date slots when switching to waitlist
        this.selectedDateSlotsChange.emit([]);
        this.selectedMemberGroupsChange.emit([]);
        this.calculateRecipientCountForWaitlist();
        this.selectedRadioOption.emit({
          selectedValue,
          includeNonGroupMembers: false,
          recipients: [],
        });
      } else if (selectedValue === 'peopleSignedUpAndWaitlist') {
        // People who have signed up and people who are on a waitlist
        this.selectedGroupsChange.emit([
          {
            label: 'People who have signed up and people who are on a waitlist',
            value: 'peopleSignedUpAndWaitlist',
          },
        ]);
        // Clear date slots when switching to signed up and waitlist
        this.selectedDateSlotsChange.emit([]);
        this.selectedMemberGroupsChange.emit([]);
        this.calculateRecipientCountForSignedUpAndWaitlist();
        this.selectedRadioOption.emit({
          selectedValue,
          includeNonGroupMembers: false,
          recipients: [],
        });
      } else if (selectedValue === 'peopleWhoNotSignedUp') {
        // People who have NOT signed up
        this.selectedGroupsChange.emit([
          {
            label: 'Group members who have not signed up',
            value: 'peopleWhoNotSignedUp',
          },
        ]);
        // Clear date slots when switching to not signed up
        this.selectedDateSlotsChange.emit([]);
        this.selectedMemberGroupsChange.emit([]);
        this.calculateRecipientCountForNotSignedUp();
        this.selectedRadioOption.emit({
          selectedValue,
          includeNonGroupMembers: false,
          recipients: [],
        });
      } else if (selectedValue === 'sendMessagePeopleIselect') {
        // People I will select - custom selection
        // For messageTypeId = 4, only validate member groups (no date slots)
        // For other message types, validate both date slots and member groups
        if (this.messageTypeId === 4) {
          // For messageTypeId = 4, only check member groups
          if (this.selectedMemberGroups.length === 0) {
            this.openInfoDialog('Please select people from groups');
            return;
          }
        } else {
          // For other message types, check both date slots and member groups
          if (
            this.selectedDateSlots.length === 0 &&
            this.selectedMemberGroups.length === 0
          ) {
            // this.toastr.error(
            //   'Please select people from groups or sign up',
            //   'Error'
            // );
            this.openInfoDialog('Please select people from groups or sign up');
            return;
          }
        }

        this.selectedGroupsChange.emit([
          {
            label: 'Custom Selection',
            value: 'sendMessagePeopleIselect',
          },
        ]);
        const groupIds = this.selectedMemberGroups
          .map((group) => group.groupsId)
          .filter((id): id is string => id !== undefined);
        this.selectedRadioOption.emit({
          selectedValue,
          includeNonGroupMembers: false,
          fromCustomGroup: this.selectedMemberGroups.length > 0,
          recipients:
            this.messageTypeId === 4
              ? this.selectedMemberGroups
              : this.selectedDateSlots.length > 0
              ? this.selectedDateSlots
              : this.selectedMemberGroups,
        });
        // Recipient count should already be set from the date slots selection
        // No need to calculate here as it's done in the date slots dialog
        if (this.selectedMemberGroups.length > 0) {
          // For messageTypeId = 4, just count the selected members without API call
          if (this.messageTypeId === 4) {
            this.recipientCountChange.emit(this.selectedMemberGroups.length);
            this.recipientsChange.emit(this.selectedMemberGroups);
          } else {
            this.calculateRecipientCount(groupIds, false);
          }
        } else if (this.messageTypeId !== 4) {
          // Only calculate for slots if not messageTypeId = 4
          this.calculateRecipientCountForSlots();
        }
      } else if (selectedValue === 'ImportEmailFromProvider') {
        // Import from provider using CloudSponge
        const cloudSpongeContacts = this.cloudSpongeService.selectedContacts();
        const cloudSpongeEmails = this.cloudSpongeService.contactEmailsArray();

        if (cloudSpongeContacts.length === 0) {
          this.openInfoDialog(
            'Please import contacts by clicking one of the provider buttons above.'
          );
          return;
        }

        this.selectedGroupsChange.emit([
          {
            label: 'Imported from provider',
            value: 'ImportEmailFromProvider',
          },
        ]);

        // Set recipient count
        this.recipientCountChange.emit(cloudSpongeContacts.length);

        // Create recipients with both name and email for the recipient details dialog
        const recipients = cloudSpongeContacts.map((contact) => ({
          email: contact.selectedEmail(),
          firstname: contact.first_name || '',
          lastname: contact.last_name || '',
          displayname: contact.fullName() || '',
        }));
        this.recipientsChange.emit(recipients);

        // Pass the imported emails as recipients (for API compatibility)
        this.selectedRadioOption.emit({
          selectedValue,
          includeNonGroupMembers: false,
          recipients: cloudSpongeEmails,
        });

        // Clear date slots when switching to import from provider
        this.selectedDateSlotsChange.emit([]);
        this.selectedMemberGroupsChange.emit([]);

        // Clear CloudSponge contacts after successful import
        // This prepares for next use
        this.cloudSpongeService.clearSelectedContacts();
      }

      // Save the current form state for restoration on next open
      this.peopleSelectionDataChange.emit(this.peopleDialogForm.value);

      this.peopleSelected.emit();
    } else {
      // User clicked X - don't reset form, just close
      // The saved state in the service will be restored on next open
    }

    if (this.groupDialogVisible) {
      this.groupDialogVisible = false;
      this.visible = true;
    } else {
      this.groupDialogVisible = false;
      this.visible = false;
      this.visibleChange.emit(false);
    }
  }

  onRadioChange(): void {
    // Skip this radio change if we're programmatically setting the value
    if (this.skipNextRadioChange) {
      this.skipNextRadioChange = false;
      return;
    }

    // Reset other form values when radio changes to prevent stale data
    this.peopleDialogForm.patchValue({
      selectedGroups: [],
      includeNonGroupMembers: false,
      manualEmails: '',
      manualEmailsGroup: [], // Clear the "Assign to" dropdown
      useGroupAlias: false,
      groupEmailAlias: '',
      rsvpResponseyes: false,
      rsvpResponseno: false,
      rsvpResponsemaybe: false,
      rsvpResponsenoresponse: false,
    });

    // Clear recipient count and recipients when switching options
    this.recipientCountChange.emit(0);
    this.recipientsChange.emit([]);

    // Always clear date slots and member groups when switching radio options
    // This ensures previous selections (including table selections) don't persist
    this.selectedDateSlotsChange.emit([]);
    this.selectedMemberGroupsChange.emit([]);

    // Clear CloudSponge contacts when switching away from ImportEmailFromProvider
    const currentValue = this.peopleDialogForm.get('selectedValue')?.value;
    if (currentValue !== 'ImportEmailFromProvider') {
      this.cloudSpongeService.clearSelectedContacts();
    }
  }

  onAliasCheckboxChange(): void {
    // Skip resetting the alias field if we're restoring saved state
    if (this.skipAliasReset) {
      this.skipAliasReset = false;
      return;
    }
    // Otherwise, reset the alias field when checkbox changes
    this.peopleDialogForm.get('groupEmailAlias')?.reset();
  }

  private isValidEmail(email: string): boolean {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  private getSelectedRsvpResponses(): string[] {
    const responses: string[] = [];
    const form = this.peopleDialogForm;

    if (form.get('rsvpResponseyes')?.value) responses.push('yes');
    if (form.get('rsvpResponseno')?.value) responses.push('no');
    if (form.get('rsvpResponsemaybe')?.value) responses.push('maybe');
    if (form.get('rsvpResponsenoresponse')?.value) responses.push('nr');

    return responses;
  }

  /**
   * Helper method to extract signup IDs from selected signups
   * @param showErrorIfEmpty - Whether to show error toast if no signups selected
   * @returns Array of signup IDs or null if validation fails
   */
  private getSignupIds(showErrorIfEmpty = false): number[] {
    if (this.selectedSignups.length === 0) {
      if (showErrorIfEmpty) {
        // this.toastr.error('Please select a signup', 'Error');
        this.openInfoDialog('Please select a signup.');
      }
      return [];
    }
    const signupIds: number[] = this.selectedSignups.map((s) =>
      parseInt(Array.isArray(s) ? s.join(',') : s.signupid)
    );
    return signupIds;
  }

  private calculateRecipientCountForSlots(): void {
    const payload = {
      sentToType: SendToType.SPECIFIC_DATE_SLOT,
      sentTo: SentTo.SPECIFIC_DATE_SLOT,
      messageTypeId: this.messageTypeId,
      signupIds: this.selectedSignups.map((s) => s.signupid),
      slotItemIds: this.selectedDateSlots.map((slot) => slot.slotitemid),
      filters: {
        p_page: 1,
        p_limit: 1000,
        p_sortBy: 'displayname',
      },
    };

    this.isLoading = true;
    this.composeService.fetchRecipients(payload).subscribe({
      next: (response) => {
        this.handleRecipientCount(response);
        this.isLoading = false;
      },
      error: () => {
        this.recipientCountChange.emit(0);
        this.recipientsChange.emit([]);
        this.isLoading = false;
      },
    });
  }

  private calculateRecipientCount(
    groupIds: string[],
    includeNonGroupMembers = false
  ): void {
    if (groupIds.length === 0) {
      this.recipientCountChange.emit(0);
      return;
    }

    const signupIds = this.selectedSignups.map((s) => s.signupid);

    // Determine sentTo value based on checkbox state
    let sentToValue = SentTo.ALL; // Default: all group members
    let payloadSignupIds: number[] | undefined = undefined;

    if (includeNonGroupMembers && signupIds.length > 0) {
      // Include both group members and non-group members who signed up
      sentToValue = SentTo.INCLUDE_NON_GROUP_MEMBERS;
      payloadSignupIds = signupIds;
    }

    // Prepare payload
    const payload = {
      sentToType: SendToType.PEOPLE_IN_GROUPS,
      sentTo: sentToValue,
      messageTypeId: this.messageTypeId,
      groupIds: groupIds.map((id) => parseInt(id, 10)),
      signupIds: payloadSignupIds,
      filters: {
        p_page: 1,
        p_limit: 1000,
        p_sortBy: 'displayname',
      },
    };

    this.isLoading = true;
    this.composeService.fetchRecipients(payload).subscribe({
      next: (response) => {
        this.handleRecipientCount(response);
        this.isLoading = false;
      },
      error: () => {
        this.recipientCountChange.emit(0);
        this.recipientsChange.emit([]);
        this.isLoading = false;
      },
    });
  }

  private calculateRecipientCountForRsvp(): void {
    const signupIds = this.getSignupIds(true);
    if (!signupIds) return;

    // Get selected RSVP responses
    const responses: string[] = [];
    const form = this.peopleDialogForm;

    if (form.get('rsvpResponseyes')?.value) responses.push('yes');
    if (form.get('rsvpResponseno')?.value) responses.push('no');
    if (form.get('rsvpResponsemaybe')?.value) responses.push('maybe');
    if (form.get('rsvpResponsenoresponse')?.value) responses.push('nr');

    // Get groupIds if available (optional but recommended for RSVP per original implementation)
    const formValue = this.peopleDialogForm.value;
    const selectedGroupIds = formValue.selectedGroups || [];
    const groupIds =
      selectedGroupIds.length > 0
        ? selectedGroupIds.map((id: string) => parseInt(id, 10))
        : undefined;

    // API v3 format: sentToType: 'specificrsvp', sentTo: 'rsvp:yes,no,maybe'
    const payload: {
      sentToType: string;
      sentTo: string;
      messageTypeId: number;
      signupIds: number[];
      groupIds?: number[];
      filters: {
        p_page: number;
        p_limit: number;
        p_sortBy: string;
      };
    } = {
      sentToType: SendToType.SPECIFIC_RSVP,
      sentTo: `rsvp:${responses.join(',')}`,
      messageTypeId: this.messageTypeId,
      signupIds: signupIds,
      filters: {
        p_page: 1,
        p_limit: 1000,
        p_sortBy: 'displayname',
      },
    };

    // Add groupIds if available
    if (groupIds && groupIds.length > 0) {
      payload.groupIds = groupIds;
    }

    this.isLoading = true;
    this.composeService.fetchRecipients(payload).subscribe({
      next: (response) => {
        this.handleRecipientCount(response);
        this.isLoading = false;
      },
      error: () => {
        this.recipientCountChange.emit(0);
        this.recipientsChange.emit([]);
        this.isLoading = false;
      },
    });
  }

  private calculateRecipientCountForSignedUp(): void {
    const signupIds = this.getSignupIds(true);
    if (!signupIds) return;

    const payload = {
      sentToType: SendToType.SIGNED_UP,
      sentTo: SentTo.SIGNED_UP,
      messageTypeId: this.messageTypeId,
      signupIds: signupIds,
      filters: {
        p_page: 1,
        p_limit: 1000,
        p_sortBy: 'displayname',
      },
    };

    this.isLoading = true;
    this.composeService.fetchRecipients(payload).subscribe({
      next: (response) => {
        this.handleRecipientCount(response);
        this.isLoading = false;
      },
      error: () => {
        this.recipientCountChange.emit(0);
        this.recipientsChange.emit([]);
        this.isLoading = false;
      },
    });
  }

  private calculateRecipientCountForNotSignedUp(): void {
    const signupIds = this.getSignupIds(false);
    if (!signupIds) return;

    const payload = {
      sentToType: SendToType.PEOPLE_IN_GROUPS,
      sentTo: SentTo.NOT_SIGNED_UP,
      messageTypeId: this.messageTypeId,
      signupIds: signupIds,
      filters: {
        p_page: 1,
        p_limit: 1000,
        p_sortBy: 'displayname',
      },
    };

    this.isLoading = true;
    this.composeService.fetchRecipients(payload).subscribe({
      next: (response) => {
        this.handleRecipientCount(response);
        this.isLoading = false;
      },
      error: () => {
        this.recipientCountChange.emit(0);
        this.recipientsChange.emit([]);
        this.isLoading = false;
      },
    });
  }

  private calculateRecipientCountForWaitlist(): void {
    const signupIds = this.getSignupIds(true);
    if (!signupIds) return;

    const payload = {
      sentToType: SendToType.WAITLIST,
      sentTo: SentTo.WAITLIST,
      messageTypeId: this.messageTypeId,
      signupIds: signupIds,
      filters: {
        p_page: 1,
        p_limit: 1000,
        p_sortBy: 'displayname',
      },
    };

    this.isLoading = true;
    this.composeService.fetchRecipients(payload).subscribe({
      next: (response) => {
        this.handleRecipientCount(response);
        this.isLoading = false;
      },
      error: () => {
        this.recipientCountChange.emit(0);
        this.recipientsChange.emit([]);
        this.isLoading = false;
      },
    });
  }

  private calculateRecipientCountForSignedUpAndWaitlist(): void {
    const signupIds = this.getSignupIds(true);
    if (!signupIds) return;

    const payload = {
      sentToType: SendToType.SIGNUP_WAITLIST,
      sentTo: SentTo.SIGNED_UP_AND_WAITLIST,
      messageTypeId: this.messageTypeId,
      signupIds: signupIds,
      filters: {
        p_page: 1,
        p_limit: 1000,
        p_sortBy: 'displayname',
      },
    };

    this.isLoading = true;
    this.composeService.fetchRecipients(payload).subscribe({
      next: (response) => {
        this.handleRecipientCount(response);
        this.isLoading = false;
      },
      error: () => {
        this.recipientCountChange.emit(0);
        this.recipientsChange.emit([]);
        this.isLoading = false;
      },
    });
  }

  /**
   * recipient count
   */
  private handleRecipientCount(response: {
    data: { recipients?: unknown[]; members?: unknown[] };
  }): void {
    if (response && response.data) {
      // Check for v3 API format first (data.recipients)
      if (
        'recipients' in response.data &&
        Array.isArray(response.data.recipients)
      ) {
        const count = response.data.recipients.length;
        this.recipientCountChange.emit(count);
        this.recipientsChange.emit(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          count > 0 ? (response.data.recipients as any[]) : []
        );
      }
      // Fallback to legacy format (data.members)
      else if (
        'members' in response.data &&
        Array.isArray(response.data.members)
      ) {
        const count = response.data.members.length;
        this.recipientCountChange.emit(count);
        this.recipientsChange.emit(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          count > 0 ? (response.data.members as any[]) : []
        );
      }
      // No recipients found
      else {
        this.recipientCountChange.emit(0);
        this.recipientsChange.emit([]);
      }
    } else {
      this.recipientCountChange.emit(0);
      this.recipientsChange.emit([]);
    }
  }

  openFromMyGroupsDialog(): void {
    this.openMyGroupDialog.emit();
  }

  openFromThisSignUpDialog(member: boolean): void {
    // Emit event to parent to open date slots dialog
    if (member) {
      this.openMyGroupDialog.emit();
    } else {
      this.openDateSlotsDialog.emit();
    }
  }

  editMemberGroups(): void {
    // Re-open the "From This Sign Up" dialog to edit selections
    this.openFromThisSignUpDialog(true);
  }

  removeSelectedMemberGroup(index: number): void {
    this.removeMemberGroup.emit(index);
  }

  removeSelectedSlot(index: number): void {
    this.removeSlot.emit(index);
  }

  editSelectedSlots(): void {
    // Re-open the "From This Sign Up" dialog to edit selections
    this.openFromThisSignUpDialog(false);
  }

  openUpdateGroupsDialog(): void {
    this.groupDialogVisible = true;
  }

  hideUpdateGroupsDialog(): void {
    this.groupDialogVisible = false;

    const formValue = this.peopleDialogForm.value;
    // If there are selected groups, ensure they remain selected in the UI
    if (formValue.selectedGroups && formValue.selectedGroups.length > 0) {
      this.peopleDialogForm.patchValue({
        selectedGroups: [...formValue.selectedGroups],
      });
    }

    setTimeout(() => {
      // Auto-select the appropriate radio option based on form type
      const autoRadioValue =
        this.formType === 'inviteToSignUp'
          ? 'peopleingroups'
          : 'sendMessagePeopleRadio';

      // Set both radio option and groups
      this.skipNextRadioChange = true; // Skip the onRadioChange to prevent clearing our selection
      this.peopleDialogForm.patchValue({
        selectedValue: autoRadioValue,
        selectedGroups: [...formValue.selectedGroups],
      });
      this.cdr.markForCheck();
    }, 0);
  }

  openInfoDialog(msg: string): void {
    this.infoMessage = msg;
    this.infoDialog = true;
  }

  closeInfoDialog(): void {
    this.infoMessage = '';
    this.infoDialog = false;
  }

  /**
   * Launch CloudSponge widget for a specific service
   * @param service - The contact provider service (e.g., 'gmail', 'yahoo', 'windowslive')
   */
  async launchCloudSponge(service: string): Promise<void> {
    try {
      // Launch the CloudSponge widget for the specified service
      await this.cloudSpongeService.launch(service);
    } catch (error) {
      console.error(
        'Failed to launch CloudSponge for service:',
        service,
        error
      );
    }
  }

  /**
   * Get selected contacts from CloudSponge and populate the manual emails field
   */
  getCloudSpongeEmails(): string {
    return this.cloudSpongeService.contactEmailsString();
  }

  /**
   * Check if CloudSponge has selected contacts
   */
  hasCloudSpongeContacts(): boolean {
    return this.cloudSpongeService.hasSelectedContacts();
  }
}
