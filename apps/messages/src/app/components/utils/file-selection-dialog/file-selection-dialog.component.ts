import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  SugUiDialogComponent,
  SugUiButtonComponent,
  SugUiRadioCheckboxButtonComponent,
  RadioCheckboxChangeEvent,
  DialogConfig,
} from '@lumaverse/sug-ui';

@Component({
  selector: 'sug-file-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    SugUiDialogComponent,
    SugUiButtonComponent,
    SugUiRadioCheckboxButtonComponent,
  ],
  templateUrl: './file-selection-dialog.component.html',
  styleUrls: ['../../compose/compose_email/compose-email.scss'],
})
export class FileSelectionDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() fileSelected = new EventEmitter<string>();

  selectedValue: string | null = null;

  dialogConfig: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '500px',
  };

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

  handleSelection(event: RadioCheckboxChangeEvent): void {
    this.selectedValue = event.value as string;
  }

  selectFile(): void {
    if (this.selectedValue) {
      this.fileSelected.emit(this.selectedValue);
    }
    this.closeDialog();
  }

  closeDialog(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.selectedValue = null;
  }
}
