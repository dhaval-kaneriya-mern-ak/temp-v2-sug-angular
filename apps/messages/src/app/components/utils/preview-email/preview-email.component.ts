import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
export class PreviewEmailComponent implements OnChanges {
  sanitizer = inject(DomSanitizer);
  @Input() visible = false;
  @Input() showTextPreview = false;
  @Input() saveCustomButton = false;
  @Input() showThemeSelection = true;
  @Input() isScheduledMessage = false;
  @Input() textMessage = '';
  @Input() availableThemes: Array<number> = [];
  siteUrl = environment.SITE_URL;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() sendNow = new EventEmitter<void>();
  @Output() themeChange = new EventEmitter<number>();
  @Output() saveCustom = new EventEmitter<number>();
  @Output() scheduleEmail = new EventEmitter<string>();
  @Input() prePopulatedDate: Date | null = null;
  @Input() prePopulatedTime: Date | null = null;

  @Input() set emailHtmlPreview(value: string) {
    this._emailHtmlPreview = value;
    this.sanitizedHtmlPreview = this.sanitizer.bypassSecurityTrustHtml(value);
  }
  get emailHtmlPreview(): string {
    return this._emailHtmlPreview;
  }
  private _emailHtmlPreview = '';
  sanitizedHtmlPreview: SafeHtml = '';

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

  ngOnChanges() {
    if (this.prePopulatedDate && this.prePopulatedTime) {
      this.scheduledDate = this.prePopulatedDate;
      this.scheduledTime = this.prePopulatedTime;
    }
  }

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

      // Combine: use year, month, day from date; hours, minutes from time, seconds always 00
      const combined = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes(),
        0, // Always set seconds to 00
        0 // Always set milliseconds to 0
      );
      const formatted = format(combined, 'yyyy-MM-dd HH:mm');
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

    // Apply hours/minutes/seconds/milliseconds from the time picker
    combinedDateTime.setHours(
      timeValue.getHours(),
      timeValue.getMinutes(),
      timeValue.getSeconds(),
      timeValue.getMilliseconds()
    );

    // Validate that the combined date/time is in the future relative to now
    return combinedDateTime.getTime() > new Date().getTime();
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
