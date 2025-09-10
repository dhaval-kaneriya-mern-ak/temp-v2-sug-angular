import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  SugUiRadioCheckboxButtonComponent,
  RadioCheckboxChangeEvent,
  SugUiSelectBoxComponent,
  SugUiDialogComponent,
  SugUiButtonComponent,
  DialogConfig,
} from '@lumaverse/sug-ui';
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
    SugUiSelectBoxComponent,
    SugUiButtonComponent,
    ButtonModule,
    BadgeModule,
    HttpClientModule,
    SugUiDialogComponent,
  ],
  templateUrl: './compose-email.html',
  styleUrls: ['./compose-email.scss'],
})
export class ComposeEmailComponent {
  dialogConf: DialogConfig = {
    modal: true,
    draggable: true,
    resizable: false,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    focusOnShow: true,
    position: 'center',
    appendTo: 'body',
    width: '70vw',
  };
  isVisible = false;

  openDialog() {
    console.log('Opening dialog...');
    this.isVisible = true;
    console.log('isVisible is now:', this.isVisible);
  }

  closeDialog() {
    console.log('Closing dialog...');
    this.isVisible = false;
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

  showRadioButtons = true;

  radioOptions = [
    { label: 'Invite people to a sign up', value: 'emailoptionone' },
    {
      label: 'Email people participating in a sign up',
      value: 'emailoptiontwo',
    },
  ];

  selectedValue: string | null = null;

  handleSelection(event: RadioCheckboxChangeEvent) {
    console.log('Value changed:', event.value);
    this.selectedValue = event.value; // Update the selected size
    this.showRadioButtons = false; // Hide the radio buttons
  }

  showOptionsAgain() {
    this.showRadioButtons = true;
    this.selectedValue = null; // Reset the selected size
  }

  sendEmail() {
    // In a real app, you would gather form data and send it.
    console.log('Sending email with size:', this.selectedValue);
    alert('Email sent! (Check the console)');
  }
}
