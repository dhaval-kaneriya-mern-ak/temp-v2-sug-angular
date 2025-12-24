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
  SugUiPaginationComponent,
  DialogConfig,
  ISugTableColumn,
  IPagination,
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
    SugUiPaginationComponent,
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
  paginatedRecipients: (IGroupMember | IRecipient)[] = [];

  paginationOptions: IPagination = {
    totalRecords: 0,
    rows: 10,
    first: 0,
    pageSizes: [5, 10, 25, 50],
  };

  ngOnInit(): void {
    this.setRecipientColumns();
    this.filterRecipients();
    this.updatePaginatedRecipients();
  }

  ngOnChanges(): void {
    this.setRecipientColumns();
    this.filterRecipients();
    this.updatePaginatedRecipients();
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

    this.paginationOptions.totalRecords = this.filteredRecipients.length;
    this.paginationOptions.first = 0;
    this.updatePaginatedRecipients();
  }

  updatePaginatedRecipients(): void {
    const start = this.paginationOptions.first;
    const end = start + this.paginationOptions.rows;
    this.paginatedRecipients = this.filteredRecipients.slice(start, end);
  }

  onPaginationChange(pagination: IPagination): void {
    this.paginationOptions = pagination;
    this.updatePaginatedRecipients();
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
