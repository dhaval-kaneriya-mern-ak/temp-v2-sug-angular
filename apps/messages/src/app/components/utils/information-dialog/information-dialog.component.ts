import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  DialogConfig,
  SugUiButtonComponent,
  SugUiDialogComponent,
} from '@lumaverse/sug-ui';

@Component({
  selector: 'sug-information-dialog',
  standalone: true,
  imports: [CommonModule, SugUiDialogComponent, SugUiButtonComponent],
  templateUrl: './information-dialog.component.html',
  styleUrls: ['./information-dialog-component.scss'],
})
export class SugInformationDialogComponent {
  @Input() visible = false;
  @Input() title = 'Title';
  @Input() message = 'Message';
  @Output() visibleChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  dialogConfig: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: false,
    dismissableMask: false,
    visible: this.visible,
    appendTo: 'body',
    position: 'center',
    width: '500px',
  };

  closeDialog(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
