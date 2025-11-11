import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  SugUiDialogComponent,
  SugUiButtonComponent,
  DialogConfig,
} from '@lumaverse/sug-ui';

@Component({
  selector: 'sug-help-dialog',
  standalone: true,
  imports: [CommonModule, SugUiDialogComponent, SugUiButtonComponent],
  templateUrl: './help-dialog.component.html',
  styleUrls: ['../../compose/compose_email/compose-email.scss'],
})
export class HelpDialogComponent {
  @Input() visible = false;
  @Input() title = 'Help';
  @Output() visibleChange = new EventEmitter<boolean>();

  dialogConfig: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '850px',
  };

  closeDialog(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
