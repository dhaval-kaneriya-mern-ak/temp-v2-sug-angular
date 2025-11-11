import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  SugUiDialogComponent,
  SugUiButtonComponent,
  SugUiDatePickerComponent,
  DialogConfig,
} from '@lumaverse/sug-ui';

@Component({
  selector: 'sug-preview-email',
  standalone: true,
  imports: [CommonModule, SugUiDialogComponent, SugUiDatePickerComponent],
  templateUrl: './preview-email.component.html',
  styleUrls: ['../../compose/compose_email/compose-email.scss'],
})
export class PreviewEmailComponent {
  @Input() visible = false;
  @Input() emailHtmlPreview = '';
  @Input() availableThemes: Array<{ id: string; image: string; name: string }> =
    [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() sendNow = new EventEmitter<void>();
  @Output() scheduleEmail = new EventEmitter<{ date: Date; time: Date }>();

  dialogConfig: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '850px',
  };

  selectedThemeId: string | null = null;
  scheduledDate: Date | null = null;
  scheduledTime: Date | null = null;
  minDate = new Date();

  onSendNow(): void {
    this.sendNow.emit();
    this.closeDialog();
  }

  onScheduleSend(): void {
    if (
      this.isScheduledDateValid() &&
      this.scheduledDate &&
      this.scheduledTime
    ) {
      this.scheduleEmail.emit({
        date: this.scheduledDate,
        time: this.scheduledTime,
      });
      this.closeDialog();
    }
  }

  isScheduledDateValid(): boolean {
    if (!this.scheduledDate || !this.scheduledTime) {
      return false;
    }

    const currentDate = new Date();
    const combinedDateTime = new Date(this.scheduledDate);
    const timeValue = new Date(this.scheduledTime);

    combinedDateTime.setHours(timeValue.getHours());
    combinedDateTime.setMinutes(timeValue.getMinutes());
    combinedDateTime.setSeconds(0);
    combinedDateTime.setMilliseconds(0);

    return combinedDateTime > currentDate;
  }

  selectTheme(themeId: string): void {
    this.selectedThemeId = themeId;
    // TODO: Update email preview with selected theme
  }

  private closeDialog(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetDialog();
  }

  private resetDialog(): void {
    this.scheduledDate = null;
    this.scheduledTime = null;
    this.selectedThemeId = null;
  }
}
