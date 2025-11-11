import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
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
export class RecipientDetailsDialogComponent {
  @Input() visible = false;
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

  recipientColumns: ISugTableColumn[] = [
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

  closeDialog(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onSort(): void {
    // Handle sort event
  }

  onPage(): void {
    // Handle page event
  }
}
