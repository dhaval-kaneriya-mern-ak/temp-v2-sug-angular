import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  SugUiRadioCheckboxButtonComponent,
  SugUiDialogComponent,
  SugUiButtonComponent,
  SugUiTooltipComponent,
  SugUiMultiSelectDropdownComponent,
  DialogConfig,
  ISelectOption,
} from '@lumaverse/sug-ui';
import {
  ISelectPortalOption,
  ISignUpItem,
  ITabGroupItem,
} from '@services/interfaces/messages-interface/compose.interface';
import { UserStateService } from '@services/user-state.service';
import { Subject, takeUntil } from 'rxjs';
import { MemberProfile } from '@services/interfaces';
import { ComposeEmailStateService } from '../services/compose-email-state.service';
import { SugInformationDialogComponent } from '../information-dialog/information-dialog.component';

@Component({
  selector: 'sug-signup-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SugUiRadioCheckboxButtonComponent,
    SugUiDialogComponent,
    SugUiButtonComponent,
    SugUiTooltipComponent,
    SugUiMultiSelectDropdownComponent,
    SugInformationDialogComponent,
  ],
  templateUrl: './signup-selection-dialog.component.html',
  styleUrls: ['../../compose/compose_email/compose-email.scss'],
})
export class SignupSelectionDialogComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Input() signUpOptions: ISelectOption[] = [];
  @Input() tabGroupsData: ITabGroupItem[] = [];
  @Input() selectedSignups: ISignUpItem[] = [];
  @Input() selectedTabGroups: ITabGroupItem[] = [];
  @Input() isSignUpIndexPageSelected = false;
  @Input() selectedPortalPages: ISelectPortalOption[] = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() signupsSelected = new EventEmitter<void>();
  @Output() signUpOptionsChange = new EventEmitter<ISelectOption[]>();
  @Output() selectedSignupsChange = new EventEmitter<ISignUpItem[]>();
  @Output() selectedTabGroupsChange = new EventEmitter<ITabGroupItem[]>();
  @Output() signUpIndexPageSelectedChange = new EventEmitter<boolean>();
  @Output() selectedPortalPagesChange = new EventEmitter<
    ISelectPortalOption[]
  >();
  private readonly destroy$ = new Subject<void>();
  private userProfile: MemberProfile | null = null;

  private fb = inject(FormBuilder);
  private userStateService = inject(UserStateService);
  composeStateService = inject(ComposeEmailStateService);

  signUpDialogForm!: FormGroup;
  infoDialog = false;
  infoMessage = '';

  dialogConfig: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: false,
    dismissableMask: true,
    position: 'center',
    width: '480px',
    contentStyleClass: 'dialog-overflow-visible',
  };

  get portalOptionsForDropdown(): ISelectOption[] {
    return this.composeStateService.portalSignUpOptions.map((option) => ({
      label: option.title || option.label || 'Untitled Portal',
      value: (option.id || option.value || '').toString(),
    }));
  }

  get tabGroupsForDropdown(): ISelectOption[] {
    return this.tabGroupsData.map((tabGroup) => ({
      label: tabGroup.name || 'Unnamed Tab Group',
      value: tabGroup.id.toString(),
    }));
  }

  get dialogRadioOptions() {
    const baseOptions: Array<{
      label: string;
      value: string;
      hasCustomContent?: boolean;
    }> = [
      { label: 'Link to specific sign up(s)', value: 'LinkSpecificSignup' },
    ];

    //only show main account option if user has tab groups or signups
    if (this.userStateService.isBasicUser(this.userProfile) === false) {
      baseOptions.push({
        label: 'Link to my main account',
        value: 'LinkMainAccount',
        hasCustomContent: true,
      });
    }

    // Only add tab groups option if we have tab groups data
    if (this.tabGroupsData && this.tabGroupsData.length > 0) {
      baseOptions.splice(1, 0, {
        label: 'Link to specific tab group(s)',
        value: 'LinkSpecifixTabGroup',
        hasCustomContent: true,
      });
    }
    // Only add portal pages option if user has access
    if (this.userProfile?.features?.portalpages) {
      baseOptions.push({
        label: 'Link to specific portal page(s)',
        value: 'LinkSpecificPortalPage',
        hasCustomContent: true,
      });
    }

    return baseOptions;
  }

  ngOnInit(): void {
    this.userStateService.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.userProfile = profile;
        },
      });
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.signUpDialogForm = this.fb.group({
      selectedSignupValue: [null],
      selectedSignups: [[]],
      selectedTabGroups: [[]],
      selectedPortalPages: [[]],
    });
  }

  openDialog(): void {
    // Pre-fill the form with currently selected signups
    if (this.selectedSignups.length > 0) {
      const signupIds = this.selectedSignups.map((signup) =>
        signup.signupid?.toString()
      );
      this.signUpDialogForm.patchValue({
        selectedSignupValue: 'LinkSpecificSignup',
        selectedSignups: signupIds,
      });
      this.updateGroupOptionsState(signupIds);
    } else if (this.selectedTabGroups.length > 0) {
      const tabGroupIds = this.selectedTabGroups.map((group) =>
        group.id?.toString()
      );
      this.signUpDialogForm.patchValue({
        selectedSignupValue: 'LinkSpecifixTabGroup',
        selectedTabGroups: tabGroupIds,
      });
    } else if (this.isSignUpIndexPageSelected) {
      this.signUpDialogForm.patchValue({
        selectedSignupValue: 'LinkMainAccount',
        selectedSignups: [],
        selectedTabGroups: [],
      });
    } else if (this.selectedPortalPages.length > 0) {
      const portalPageIds = this.selectedPortalPages
        .map((page) => page.id?.toString())
        .filter(Boolean);
      this.signUpDialogForm.patchValue({
        selectedSignupValue: 'LinkSpecificPortalPage',
        selectedPortalPages: portalPageIds,
      });
    } else {
      // Don't set any default value - let user choose
      this.signUpDialogForm.patchValue({
        selectedSignupValue: null,
        selectedSignups: [],
        selectedTabGroups: [],
        selectedPortalPages: [],
      });
    }

    this.visible = true;
    this.visibleChange.emit(true);
  }

  closeDialog(cancelled: boolean): void {
    if (!cancelled) {
      const formValue = this.signUpDialogForm.value;
      const selectedValue = formValue.selectedSignupValue;

      if (!selectedValue) {
        this.openInfoDialog('You have not selected a sign up link.');
        return;
      }

      if (selectedValue === 'LinkSpecificSignup') {
        let selectedSignupIds = formValue.selectedSignups || [];

        if (
          this.userStateService.isBasicUser(this.userProfile) &&
          selectedSignupIds.length > 1
        ) {
          selectedSignupIds = [selectedSignupIds[selectedSignupIds.length - 1]];
          this.signUpDialogForm.patchValue({
            selectedSignups: selectedSignupIds,
          });
        }
        if (selectedSignupIds.length === 0) {
          this.openInfoDialog(
            'You must select one or more sign ups from the list.'
          );
          return;
        }

        // Find the full signup objects from the options
        const allSignups: ISignUpItem[] = [];
        this.signUpOptions.forEach((group) => {
          if (group.items) {
            group.items.forEach(
              (item: ISelectOption & { signupData?: ISignUpItem }) => {
                if (selectedSignupIds.includes(item.value) && item.signupData) {
                  allSignups.push(item.signupData);
                }
              }
            );
          }
        });
        this.selectedSignupsChange.emit(allSignups);
        this.selectedTabGroupsChange.emit([]);
        this.signUpIndexPageSelectedChange.emit(false);
        this.selectedPortalPagesChange.emit([]);
      } else if (selectedValue === 'LinkSpecifixTabGroup') {
        const selectedTabGroupIds = formValue.selectedTabGroups || [];
        if (selectedTabGroupIds.length === 0) {
          this.openInfoDialog(
            'You must select one or more tab groups from the list.'
          );
          return;
        }
        const tabGroups = this.tabGroupsData.filter((group) =>
          selectedTabGroupIds.includes(group.id.toString())
        );
        this.selectedSignupsChange.emit([]);
        this.selectedTabGroupsChange.emit(tabGroups);
        this.signUpIndexPageSelectedChange.emit(false);
        this.selectedPortalPagesChange.emit([]);
      } else if (selectedValue === 'LinkMainAccount') {
        this.selectedSignupsChange.emit([]);
        this.selectedTabGroupsChange.emit([]);
        this.signUpIndexPageSelectedChange.emit(true);
        this.selectedPortalPagesChange.emit([]);
      } else if (selectedValue === 'LinkSpecificPortalPage') {
        const selectedPortalPageIds = formValue.selectedPortalPages || [];

        // Validate that at least one portal page is selected
        if (selectedPortalPageIds.length === 0) {
          this.openInfoDialog(
            'You must select one or more portal pages from the list.'
          );
          return;
        }

        // You might want to emit the portal page selection or handle it differently
        // For now, we'll clear other selections
        this.selectedSignupsChange.emit([]);
        this.selectedTabGroupsChange.emit([]);
        this.signUpIndexPageSelectedChange.emit(false);
        console.log(
          'changes',
          this.composeStateService.portalSignUpOptions,
          selectedPortalPageIds
        );

        this.selectedPortalPagesChange.emit(
          this.composeStateService.portalSignUpOptions.filter(
            (page) =>
              page?.id && selectedPortalPageIds.includes(page.id.toString())
          ) ?? []
        );
      } else {
        // Reset form to previous values
        this.initializeForm();
      }

      this.signupsSelected.emit();
      this.visible = false;
      this.visibleChange.emit(false);
    }
  }

  onSignUpSelectionChange(event: { value: string[] }): void {
    let values = event.value || [];
    // Restrict basic users to only one signup selection
    if (
      this.userStateService.isBasicUser(this.userProfile) &&
      values.length > 1
    ) {
      values = [values[values.length - 1]];
    }
    this.signUpDialogForm.patchValue({ selectedSignups: values });
    this.updateGroupOptionsState(values);
  }

  onTabGroupSelectionChange(event: { value: string[] }): void {
    this.signUpDialogForm.patchValue({ selectedTabGroups: event.value });
  }

  onPortalPageSelectionChange(event: { value: string[] }): void {
    let values = event.value || [];
    // Restrict basic users to only one portal page selection
    if (
      this.userStateService.isBasicUser(this.userProfile) &&
      values.length > 1
    ) {
      values = [values[values.length - 1]];
    }
    this.signUpDialogForm.patchValue({ selectedPortalPages: values });
  }

  getSignupLinkRadioValue(value: string): void {
    this.signUpDialogForm.patchValue({ selectedSignupValue: value });

    // Clear form controls and state for options that are not selected
    if (value !== 'LinkSpecificSignup') {
      this.signUpDialogForm.patchValue({ selectedSignups: [] });
      // Reset the signUpOptions state
      this.updateGroupOptionsState([]);
    }

    if (value !== 'LinkSpecifixTabGroup') {
      this.signUpDialogForm.patchValue({ selectedTabGroups: [] });
    }

    if (value !== 'LinkSpecificPortalPage') {
      this.signUpDialogForm.patchValue({ selectedPortalPages: [] });
    }
  }

  private updateGroupOptionsState(selectedValues: string[]): void {
    if (!selectedValues || selectedValues.length === 0) {
      // Reset all options to enabled
      const resetOptions = this.signUpOptions.map((group) => ({
        ...group,
        disabled: false,
        items: group.items?.map((item: ISelectOption) => ({
          ...item,
          disabled: false,
        })),
      }));
      this.signUpOptionsChange.emit(resetOptions);
      return;
    }

    // Determine which group(s) have selected items
    const firstGroupHasSelection = selectedValues.some((val) => {
      const firstGroup = this.signUpOptions[0];
      return firstGroup?.items?.some(
        (item: ISelectOption) => item.value === val
      );
    });

    const secondGroupHasSelection = selectedValues.some((val) => {
      const secondGroup = this.signUpOptions[1];
      return secondGroup?.items?.some(
        (item: ISelectOption) => item.value === val
      );
    });

    // Update options based on selection
    const updatedOptions = this.signUpOptions.map((group, groupIndex) => {
      if (groupIndex === 0 && secondGroupHasSelection) {
        // Disable first group if second group has selection
        return {
          ...group,
          disabled: true,
          items: group.items?.map((item: ISelectOption) => ({
            ...item,
            disabled: true,
          })),
        };
      } else if (groupIndex === 1 && firstGroupHasSelection) {
        // Disable second group if first group has selection
        return {
          ...group,
          disabled: true,
          items: group.items?.map((item: ISelectOption) => ({
            ...item,
            disabled: true,
          })),
        };
      }
      return group;
    });

    this.signUpOptionsChange.emit(updatedOptions);
  }

  openMemberIndexPage(): void {
    const url = this.composeStateService.getMemberIndexPageUrl;
    if (url) {
      window.open(url, '_blank');
    }
  }

  openInfoDialog(msg: string): void {
    this.infoMessage = msg;
    this.infoDialog = true;
  }

  closeInfoDialog(): void {
    this.infoMessage = '';
    this.infoDialog = false;
  }
}
