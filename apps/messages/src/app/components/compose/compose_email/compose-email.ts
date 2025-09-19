import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  SugUiRadioCheckboxButtonComponent,
  RadioCheckboxChangeEvent,
  SugUiDialogComponent,
  SugUiButtonComponent,
  SugUiTooltipComponent,
  SugUiMultiSelectDropdownComponent,
  DialogConfig,
  SugUiTableComponent,
} from '@lumaverse/sug-ui';
import { ISugTableConfig, ISugTableColumn } from '@lumaverse/sug-ui';
import { ISelectOption } from '@lumaverse/sug-ui';
import { HttpClientModule } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'sug-compose-email',
  standalone: true,
  imports: [
    CommonModule,
    SugUiRadioCheckboxButtonComponent,
    SugUiButtonComponent,
    SugUiTooltipComponent,
    ButtonModule,
    BadgeModule,
    SugUiMultiSelectDropdownComponent,
    HttpClientModule,
    SugUiDialogComponent,
    SugUiTableComponent,
  ],
  templateUrl: './compose-email.html',
  styleUrls: ['./compose-email.scss'],
})
export class ComposeEmailComponent {
  // Dialog configuration for "Select Sign Ups" dialog
  dialogConf: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '480px',
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

  isVisible = false;
  isPeopleDialogVisible = false;
  isSelectFileDialogVisible = false;
  isHelpDialogVisible = false;
  isPeopleSendMessageDialogVisible = false;
  isFromMyGroupsDialogVisible = false;
  isFromThisSignUpDialogVisible = false;

  constructor() {
    // Initialization if needed
  }

  // Methods for "Select Sign Ups" dialog
  openDialog() {
    this.dialogSelectedValue = null; // Reset dialog selection
    this.isVisible = true;
  }

  closeDialog() {
    this.isVisible = false;
  }

  // Methods for "Select People" dialog
  openPeopleDialog() {
    this.isPeopleDialogVisible = true;
  }

  closePeopleDialog() {
    this.isPeopleDialogVisible = false;
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

  closePeopleSendMessageDialog() {
    this.isPeopleSendMessageDialogVisible = false;
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
  }

  closeFromThisSignUpDialog() {
    this.isFromThisSignUpDialogVisible = false;
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
  sendMessagePeopleRadioOptions = [
    {
      label: 'People who have signed up',
      value: 'sendMessagePeopleRadioOne',
      hasCustomContent: true,
    },
    {
      label: 'People who have NOT signed up',
      value: 'sendMessagePeopleRadioTwo',
      hasCustomContent: true,
    },
    {
      label: 'People in specific group(s)',
      value: 'sendMessagePeopleRadioThree',
      hasCustomContent: true,
    },
    {
      label: 'People I will select',
      value: 'sendMessagePeopleRadioFour',
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

  // Dialog state for people send message radio selection
  peopleSendMessageSelectedValue: string | null = null;
  includeNonGroupMembers = false;
  useGroupAlias = false;

  // Method to handle dialog radio selection
  handleDialogSelection(event: RadioCheckboxChangeEvent) {
    this.dialogSelectedValue = event.value;
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

  radioOptions = [
    { label: 'Invite people to a sign up', value: 'emailoptionone' },
    {
      label: 'Email people participating in a sign up',
      value: 'emailoptiontwo',
    },
  ];

  selectedValue: string | null = null;
  includeNonGroupMembersForPeople = false;

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
      field: 'date',
      header: 'Date',
      sortable: true,
      filterable: false,
    },
    {
      field: 'slots',
      header: 'Slots',
      sortable: true,
      filterable: false,
    },
    {
      field: 'signup',
      header: 'Signed Up',
      sortable: true,
      filterable: false,
    },
  ];
  tableSignUpData = [
    {
      date: '08/05/2024',
      slots: 'a',
      signup: ' ',
    },
    {
      date: '12/20/2025',
      slots: 'a',
      signup: ' ',
    },
  ];

  onSort(): void {
    // Handle table sorting
    // Implementation can be added based on requirements
  }

  onFilter(): void {
    // Handle table filtering
    // Implementation can be added based on requirements
  }

  onPage(): void {
    // Handle table pagination
    // Implementation can be added based on requirements
  }
}
