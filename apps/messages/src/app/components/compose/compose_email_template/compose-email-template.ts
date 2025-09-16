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
  selector: 'sug-compose-email-template',
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
  templateUrl: './compose-email-template.html',
  styleUrls: ['./compose-email-template.scss'],
})
export class ComposeEmailTemplateComponent {
  constructor() {
    // Initialization logic if needed
  }
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

  isSelectFileDialogVisible = false;
  isHelpDialogVisible = false;
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

  dialogRadioOptions = [
    { label: 'Link to specific sign up(s)', value: 'dialogemailoptionone' },
    {
      label: 'Link to my main account',
      value: 'dialogemailoptiontwo',
      hasCustomContent: true,
    },
  ];
  sendMessageRadioOptions = [
    {
      label: 'Members in the following group(s)',
      value: 'sendMessageRadioOne',
      hasCustomContent: true,
    },
    {
      label: 'Manually enter emails',
      value: 'sendMessageRadioTwo',
      hasCustomContent: true,
    },
    {
      label: 'Import emails from my provider',
      value: 'sendMessageRadioThree',
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
    { label: 'Create a reminder email template', value: 'emailoptionone' },
    {
      label: 'Create a confirmation email template',
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
