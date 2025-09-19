import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  SugUiRadioCheckboxButtonComponent,
  RadioCheckboxChangeEvent,
  SugUiSelectBoxComponent,
  SugUiDialogComponent,
  SugUiButtonComponent,
  SugUiTooltipComponent,
  SugUiMultiSelectDropdownComponent,
  DialogConfig,
} from '@lumaverse/sug-ui';
import { ISelectOption } from '@lumaverse/sug-ui';
import { HttpClientModule } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'sug-compose-text-message',
  standalone: true,
  imports: [
    CommonModule,
    SugUiRadioCheckboxButtonComponent,
    SugUiSelectBoxComponent,
    SugUiButtonComponent,
    SugUiTooltipComponent,
    ButtonModule,
    BadgeModule,
    SugUiMultiSelectDropdownComponent,
    HttpClientModule,
    SugUiDialogComponent,
  ],
  templateUrl: './compose-text-message.html',
  styleUrls: ['./compose-text-message.scss'],
})
export class ComposeTextMessageComponent {
  constructor() {
    // Initialization logic if needed
  }
  peopleDialogConf: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '600px',
  };
  isPeopleDialogVisible = false;
  includeNonGroupMembersForGroups = false;

  // Methods for "Select People" dialog
  openPeopleDialog() {
    this.isPeopleDialogVisible = true;
  }

  closePeopleDialog() {
    this.isPeopleDialogVisible = false;
  }

  selectFileDialogConf: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '500px',
  };
  isSelectFileDialogVisible = false;
  openSelectFileDialog() {
    this.isSelectFileDialogVisible = true;
  }

  closeSelectFileDialog() {
    this.isSelectFileDialogVisible = false;
  }

  helpDialogConf: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '850px',
  };
  isHelpDialogVisible = false;

  // Methods for help dialog
  openHelpDialog() {
    this.isHelpDialogVisible = true;
  }

  closeHelpDialog() {
    this.isHelpDialogVisible = false;
  }

  selectOptions: ISelectOption[] = [
    {
      label: 'Option 1',
      value: 'option1',
    },
    {
      label: 'Option 2',
      value: 'option2',
    },
  ];

  defaultOption: ISelectOption = this.selectOptions[0];

  // Options for the dialog select box when first radio option is selected
  signUpOptions: ISelectOption[] = [
    {
      label: 'Select Sign Up(s)',
      value: 'Select-Sign',
    },
    {
      label: 'Test',
      value: 'test',
    },
    {
      label: 'Venmo',
      value: 'venmo',
    },
  ];

  defaultSignUpOption: ISelectOption = this.signUpOptions[0];

  showRadioButtons = true;

  checkboxOptions = [
    { label: 'Include reply-to info', value: 'dialogemailoptionone' },
    {
      label: 'Include sign up link',
      value: 'dialogemailoptiontwo',
    },
    {
      label: 'Send message via email when text is not available',
      value: 'dialogemailoptionthree',
    },
  ];
  sendMessageRadioOptions = [
    {
      label: 'People who have signed up',
      value: 'sendMessageRadioOne',
      hasCustomContent: true,
    },
    {
      label: 'People who have NOT signed up',
      value: 'sendMessageRadioTwo',
      hasCustomContent: true,
    },
    {
      label: 'People in specific group(s)',
      value: 'sendMessageRadioThree',
      hasCustomContent: true,
    },
    {
      label: 'People I will select',
      value: 'sendMessageRadioFour',
      hasCustomContent: true,
    },
  ];

  // Options for sendMessageRadioOne
  sendMessageSelectOne = [
    {
      label: '1216',
      value: '1216',
    },
    {
      label: 'Aly 12/9',
      value: 'Aly12/9',
    },
    {
      label: 'Test Group',
      value: 'testgroup',
    },
  ];

  // Options for sendMessageRadioTwo
  sendMessageSelectTwo = [
    {
      label: 'Default Group',
      value: 'defaultgroup',
    },
    {
      label: 'Custom Group',
      value: 'customgroup',
    },
  ];

  // Options for sendMessageRadioThree
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

  // Checkbox state
  accepted = false;

  // Checkbox selection tracking
  selectedCheckboxes: string[] = [];

  // Method to handle checkbox selection
  handleCheckboxSelection(event: RadioCheckboxChangeEvent) {
    this.selectedCheckboxes = Array.isArray(event.value)
      ? event.value
      : [event.value];
  }

  // Helper methods to check if specific checkbox is selected
  isCheckbox1Selected(): boolean {
    return this.selectedCheckboxes.includes('dialogemailoptionone');
  }

  isCheckbox3Selected(): boolean {
    return this.selectedCheckboxes.includes('dialogemailoptionthree');
  }

  // Dialog state for radio selection
  dialogSelectedValue: string | null = null;

  // Method to handle dialog radio selection
  handleDialogSelection(event: RadioCheckboxChangeEvent) {
    this.dialogSelectedValue = event.value;
  }

  // Method to preview account index
  previewAcctIndex() {
    // Add your preview logic here
  }

  // Method to show tooltip info
  showTooltipInfo() {
    // You can show additional info or another dialog here
  }

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

  selectedValue: string | null = null;

  handleSelection(event: RadioCheckboxChangeEvent) {
    this.selectedValue = event.value; // Update the selected size
    this.showRadioButtons = false; // Hide the radio buttons
  }

  showOptionsAgain() {
    this.showRadioButtons = true;
    this.selectedValue = null; // Reset the selected size
  }

  sendEmail() {
    // In a real app, you would gather form data and send it.

    alert('Email sent! (Check the console)');
  }
}
