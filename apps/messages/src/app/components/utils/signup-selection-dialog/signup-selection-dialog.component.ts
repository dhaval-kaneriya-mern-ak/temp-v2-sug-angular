import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
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
import { ISignUpItem } from '@services/interfaces/messages-interface/compose.interface';
import { ToastrService } from 'ngx-toastr';

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
  ],
  templateUrl: './signup-selection-dialog.component.html',
  styleUrls: ['../../compose/compose_email/compose-email.scss'],
})
export class SignupSelectionDialogComponent implements OnInit {
  @Input() visible = false;
  @Input() signUpOptions: ISelectOption[] = [];
  @Input() tabGroupsData: ISelectOption[] = [];
  @Input() selectedSignups: ISignUpItem[] = [];
  @Input() selectedTabGroups: ISelectOption[] = [];
  @Input() isSignUpIndexPageSelected = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() signupsSelected = new EventEmitter<void>();
  @Output() signUpOptionsChange = new EventEmitter<ISelectOption[]>();
  @Output() selectedSignupsChange = new EventEmitter<ISignUpItem[]>();
  @Output() selectedTabGroupsChange = new EventEmitter<ISelectOption[]>();
  @Output() signUpIndexPageSelectedChange = new EventEmitter<boolean>();

  toastr = inject(ToastrService);
  private fb = inject(FormBuilder);

  signUpDialogForm!: FormGroup;

  dialogConfig: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: false,
    dismissableMask: true,
    position: 'center',
    width: '480px',
    contentStyleClass: 'dialog-overflow-visible',
  };

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
      baseOptions.splice(1, 0, {
        label: 'Link to specific tab group(s)',
        value: 'LinkSpecifixTabGroup',
        hasCustomContent: true,
      });
    }

    return baseOptions;
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.signUpDialogForm = this.fb.group({
      selectedSignupValue: [null],
      selectedSignups: [[]],
      selectedTabGroups: [[]],
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
      const tabGroupIds = this.selectedTabGroups.map((group) => group.value);
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
    } else {
      // Don't set any default value - let user choose
      this.signUpDialogForm.patchValue({
        selectedSignupValue: null,
        selectedSignups: [],
        selectedTabGroups: [],
      });
    }

    this.visible = true;
    this.visibleChange.emit(true);
  }

  closeDialog(cancelled: boolean): void {
    if (!cancelled) {
      const formValue = this.signUpDialogForm.value;
      const selectedValue = formValue.selectedSignupValue;

      // Validate that a radio option is selected
      if (!selectedValue) {
        this.toastr.error('Please select an option', 'Error');
        return;
      }

      if (selectedValue === 'LinkSpecificSignup') {
        const selectedSignupIds = formValue.selectedSignups || [];

        // Validate that at least one signup is selected
        if (selectedSignupIds.length === 0) {
          this.toastr.error('Please select at least one sign up', 'Error');
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
      } else if (selectedValue === 'LinkSpecifixTabGroup') {
        const selectedTabGroupIds = formValue.selectedTabGroups || [];

        // Validate that at least one tab group is selected
        if (selectedTabGroupIds.length === 0) {
          this.toastr.error('Please select at least one tab group', 'Error');
          return;
        }

        // Find the full tab group objects
        const tabGroups = this.tabGroupsData.filter((group) =>
          selectedTabGroupIds.includes(group.value)
        );

        this.selectedSignupsChange.emit([]);
        this.selectedTabGroupsChange.emit(tabGroups);
        this.signUpIndexPageSelectedChange.emit(false);
      } else if (selectedValue === 'LinkMainAccount') {
        this.selectedSignupsChange.emit([]);
        this.selectedTabGroupsChange.emit([]);
        this.signUpIndexPageSelectedChange.emit(true);
      }

      this.signupsSelected.emit();
    } else {
      // Reset form to previous values
      this.initializeForm();
    }

    this.visible = false;
    this.visibleChange.emit(false);
  }

  onSignUpSelectionChange(event: { value: string[] }): void {
    this.signUpDialogForm.patchValue({ selectedSignups: event.value });
    this.updateGroupOptionsState(event.value);
  }

  onTabGroupSelectionChange(event: { value: string[] }): void {
    this.signUpDialogForm.patchValue({ selectedTabGroups: event.value });
  }

  getSignupLinkRadioValue(_value: string): void {
    // No action needed currently
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
}
