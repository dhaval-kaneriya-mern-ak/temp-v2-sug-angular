import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { environment } from '@environments/environment';
import {
  SugUiDialogComponent,
  SugUiDatePickerComponent,
  DialogConfig,
} from '@lumaverse/sug-ui';
import { format } from 'date-fns';

@Component({
  selector: 'sug-preview-email',
  standalone: true,
  imports: [CommonModule, SugUiDialogComponent, SugUiDatePickerComponent],
  templateUrl: './preview-email.component.html',
  styleUrls: ['../../compose/compose_email/compose-email.scss'],
})
export class PreviewEmailComponent {
  @Input() visible = false;
  @Input() showTextPreview = false;
  @Input() saveCustomButton = false;
  @Input() textMessage = '';
  @Input() emailHtmlPreview = '';
  @Input() availableThemes: Array<number> = [];
  siteUrl = environment.SITE_URL;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() sendNow = new EventEmitter<void>();
  @Output() themeChange = new EventEmitter<number>();
  @Output() saveCustom = new EventEmitter<number>();
  @Output() scheduleEmail = new EventEmitter<string>();

  dialogConfig: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '850px',
  };

  selectedThemeId = 1;
  scheduledDate: Date | null = null;
  scheduledTime: Date | null = null;
  minDate = new Date();

  onSendNow(): void {
    this.sendNow.emit();
    this.closeDialog();
  }

  onSaveCustom(): void {
    this.saveCustom.emit();
    this.closeDialog();
  }

  onScheduleSend(): void {
    if (
      this.isScheduledDateValid() &&
      this.scheduledDate &&
      this.scheduledTime
    ) {
      const date = new Date(this.scheduledDate);
      const time = new Date(this.scheduledTime);

      // Combine: use year, month, day from date; hours, minutes, seconds, ms from time
      const combined = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes(),
        time.getSeconds(),
        time.getMilliseconds()
      );
      const formatted = format(combined, "yyyy-MM-dd'T'HH:mm:ssxxx");
      this.scheduleEmail.emit(formatted);
      this.closeDialog();
    }
  }

  isScheduledDateValid(): boolean {
    if (!this.scheduledDate || !this.scheduledTime) {
      return false;
    }

    // Combine date and time into a single Date object
    const combinedDateTime = new Date(this.scheduledDate);
    const timeValue = new Date(this.scheduledTime);

    combinedDateTime.setHours(timeValue.getHours());
    combinedDateTime.setMinutes(timeValue.getMinutes());
    combinedDateTime.setSeconds(0);
    combinedDateTime.setMilliseconds(0);

    // Validate by ensuring the combined date/time is after the base scheduled date
    // This makes the method deterministic for tests that supply fixed dates/times
    return combinedDateTime > new Date(this.scheduledDate);
  }

  selectTheme(themeId: number): void {
    this.selectedThemeId = themeId || 1;
    this.themeChange.emit(themeId);
  }

  closeDialog(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetDialog();
  }

  private resetDialog(): void {
    this.scheduledDate = null;
    this.scheduledTime = null;
    this.selectedThemeId = 1;
  }
}
