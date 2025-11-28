import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnChanges,
} from '@angular/core';
import {
  SugUiDialogComponent,
  SugUiButtonComponent,
  SugUiTableComponent,
  DialogConfig,
  ISugTableColumn,
} from '@lumaverse/sug-ui';
import {
  IRecipient,
  IGroupMember,
} from '@services/interfaces/messages-interface/compose.interface';

@Component({
  selector: 'sug-recipient-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    SugUiDialogComponent,
    SugUiButtonComponent,
    SugUiTableComponent,
  ],
  templateUrl: './recipient-details-dialog.component.html',
  styleUrls: ['../../compose/compose_email/compose-email.scss'],
})
export class RecipientDetailsDialogComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() textOption = false;
  @Input() recipients: (IGroupMember | IRecipient)[] = [];
  @Output() visibleChange = new EventEmitter<boolean>();

  dialogConfig: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '800px',
  };

  recipientColumns: ISugTableColumn[] = [];
  filteredRecipients: (IGroupMember | IRecipient)[] = [];

  ngOnInit(): void {
    this.setRecipientColumns();
    this.filterRecipients();
  }

  ngOnChanges(): void {
    this.setRecipientColumns();
    this.filterRecipients();
  }

  private setRecipientColumns(): void {
    if (this.textOption === true) {
      this.recipientColumns = [
        {
          field: 'displayname',
          header: 'Name',
          sortable: true,
          filterable: false,
        },
        {
          field: 'mobile',
          header: 'Mobile',
          sortable: true,
          filterable: false,
        },
      ];
    } else {
      this.recipientColumns = [
        {
          field: 'displayname',
          header: 'Name',
          sortable: true,
          filterable: false,
        },
        {
          field: 'email',
          header: 'Email',
          sortable: true,
          filterable: false,
        },
      ];
    }
  }

  private filterRecipients(): void {
    if (!this.recipients || this.recipients.length === 0) {
      this.filteredRecipients = [];
      return;
    }

    if (this.textOption === true) {
      this.filteredRecipients = this.recipients.filter((r) => {
        if ('smsoptin' in r) {
          return r.smsoptin === true;
        }
        if ('textoptin' in r) {
          return r.textoptin === true;
        }
        return false;
      });
    } else {
      this.filteredRecipients = this.recipients.filter((r) => {
        if ('smsoptin' in r) {
          return r.smsoptin === false;
        }
        if ('textoptin' in r) {
          return r.textoptin === false || r.textoptin === undefined;
        }
        return true;
      });
    }
  }

  closeDialog(): void {
    this.visible = false;
    this.filteredRecipients = [];
    this.visibleChange.emit(false);
  }

  onSort(): void {
    // Handle sort event
  }

  onPage(): void {
    // Handle page event
  }
}
