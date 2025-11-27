import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  SugUiDialogComponent,
  SugUiButtonComponent,
  SugUiTableComponent,
  DialogConfig,
  ISugTableColumn,
  ISugTableConfig,
  SugUiLoadingSpinnerComponent,
} from '@lumaverse/sug-ui';
import { ComposeService } from '../../compose/compose.service';
import {
  IRecipient,
  ISignUpItem,
  IMemberInfoDto,
} from '@services/interfaces/messages-interface/compose.interface';

@Component({
  selector: 'sug-my-group-selection',
  imports: [
    CommonModule,
    SugUiDialogComponent,
    SugUiButtonComponent,
    SugUiTableComponent,
    SugUiLoadingSpinnerComponent,
  ],
  templateUrl: './my-group-selection.html',
  styleUrls: ['../../compose/compose_email/compose-email.scss'],
})
export class MyGroupSelection implements OnChanges, OnInit {
  @Input() visible = false;
  @Input() selectedSignups: ISignUpItem[] = [];
  @Input() selectedMemberGroups: IMemberInfoDto[] = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() groupMemberSelected = new EventEmitter<void>();
  @Output() selectedMemberGroupsChange = new EventEmitter<IMemberInfoDto[]>();
  @Output() recipientCountChange = new EventEmitter<number>();
  @Output() recipientsChange = new EventEmitter<IRecipient[]>();

  private composeService = inject(ComposeService);
  isLoading = false;
  dialogConfig: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '900px',
    height: '600px',
  };

  tableColumns: ISugTableColumn[] = [
    {
      field: 'firstname',
      header: 'First Name',
      sortable: true,
      filterable: false,
    },
    {
      field: 'lastname',
      header: 'Last Name',
      sortable: true,
      filterable: false,
    },
    {
      field: 'email',
      header: 'Email',
      sortable: false,
      filterable: false,
    },
    {
      field: 'groups',
      header: 'Group',
      sortable: false,
      filterable: false,
    },
  ];

  tableConfig: ISugTableConfig = {
    selectionMode: 'multiple',
    dataKey: 'id',
  };

  tableData: IMemberInfoDto[] = [];
  fullMemberData: IMemberInfoDto[] = [];
  selectedMember: IMemberInfoDto[] = [];
  selectedDisplayMember: IMemberInfoDto[] = [];
  currentPage = 1;
  pageSize = 100;
  totalPages = 1;
  sortBy = 'itemorder,item,starttime';

  ngOnInit(): void {
    // Pre-load selected slots if any - convert from state service type to full type
    const savedMembers = this.selectedMemberGroups;
    if (savedMembers.length > 0 && this.fullMemberData.length > 0) {
      const savedIds = savedMembers.map((s) => s.id);
      this.selectedMember = this.fullMemberData.filter((slot) =>
        savedIds.includes(slot.id)
      );
      // Update display selection
      this.selectedDisplayMember = this.tableData.filter((display) =>
        savedIds.includes(display.id)
      );
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Clear selections when selectedMemberGroups input is cleared
    if (
      changes['selectedMemberGroups'] &&
      !changes['selectedMemberGroups'].firstChange
    ) {
      const currentValue = changes['selectedMemberGroups'].currentValue;
      if (!currentValue || currentValue.length === 0) {
        // Clear internal selections when input is cleared
        this.selectedMember = [];
        this.selectedDisplayMember = [];
      }
    }

    // Reload data when dialog becomes visible
    if (
      changes['visible'] &&
      changes['visible'].currentValue === true &&
      !changes['visible'].firstChange
    ) {
      this.getGroupsWithMembers();
    }
  }

  openDialog(): void {
    this.getGroupsWithMembers();
  }

  closeDialog(cancelled: boolean): void {
    if (cancelled) {
      // Close dialog immediately
      this.visible = false;
      this.visibleChange.emit(false);

      // Use setTimeout to restore state after dialog closes
      setTimeout(() => {
        const savedMembers = this.selectedMemberGroups;
        if (savedMembers.length > 0) {
          const savedIds = savedMembers.map((s) => s.id);
          this.selectedMember = this.fullMemberData.filter((slot) =>
            savedIds.includes(slot.id)
          );
        } else {
          // No saved members, clear selections
          this.selectedMember = [];
          this.selectedDisplayMember = [];
        }
      }, 0);
    } else if (this.selectedMember.length > 0) {
      // Convert selected members to state service format
      const membersForState = this.selectedMember.map((slot) => ({
        id: slot.id,
        email: slot.email,
        displayname: slot.firstname + ' ' + slot.lastname,
        firstname: slot.firstname,
        lastname: slot.lastname,
        groups: slot.groups,
        groupsId: slot.groupsId,
      }));

      // For "People I will select" with date slots, the recipient count is the number of slots selected
      const totalRecipients = this.selectedMember.length;
      // Extract unique recipients from all selected slots for recipient details
      // Include both signed-up and waitlisted members
      const allRecipients: IRecipient[] = [];

      this.selectedMember.forEach((name) => {
        allRecipients.push({
          displayname: name.displayname || '',
          email: name.email, // Email not available in slot data
          mobile: '',
          memberid: name.id,
          smsoptin: false,
        });
      });

      // Update state with selected members and recipient count BEFORE closing
      this.selectedMemberGroupsChange.emit(membersForState);
      this.recipientCountChange.emit(totalRecipients);
      this.recipientsChange.emit(allRecipients);

      // Now close dialog and emit event
      this.visible = false;
      this.visibleChange.emit(false);
      this.groupMemberSelected.emit();
    } else {
      // No selections, just close
      this.visible = false;
      this.visibleChange.emit(false);
    }
  }

  /**
   * Load group members from API
   * Implements Use Case 2: Get Slots with Signed-Up Members
   */
  private getGroupsWithMembers(): void {
    this.isLoading = true;

    this.composeService.getAllGroupsWithMembers().subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          // Store full member data
          this.fullMemberData = response.data.map((member) => ({
            id: member.member.id,
            firstname: member.member.firstname,
            displayname: member.member.firstname + ' ' + member.member.lastname,
            lastname: member.member.lastname,
            email: member.member.email,
            groups: member.groups.map((g) => g.title).join(', '),
            groupsId: member.groups.map((g) => g.id).join(', '),
          }));

          this.tableData = [];
          response.data.forEach((member) => {
            this.tableData.push({
              firstname: member.member.firstname,
              displayname:
                member.member.firstname + ' ' + member.member.lastname,
              lastname: member.member.lastname,
              id: member.member.id,
              email: member.member.email,
              groups: member.groups.map((g) => g.title).join(', '),
              groupsId: member.groups.map((g) => g.id).join(', '),
            });
          });

          // // Pre-select previously selected slots from state service
          const savedMembers = this.selectedMemberGroups;
          if (savedMembers.length > 0) {
            const savedIds = savedMembers.map((s) => s.id);

            // Find matching slots in fullMemberData
            this.selectedMember = this.fullMemberData.filter((slot) =>
              savedIds.includes(slot.id)
            );

            // Update display selection to show checkboxes as checked
            this.selectedDisplayMember = this.tableData.filter((display) =>
              savedIds.includes(display.id)
            );
          }
        } else {
          this.tableData = [];
          this.fullMemberData = [];
        }
        this.isLoading = false;

        // Open dialog after data is loaded successfully
        this.visible = true;
        this.visibleChange.emit(true);
      },
      error: () => {
        this.tableData = [];
        this.fullMemberData = [];
        this.isLoading = false;
        this.visible = true;
        this.visibleChange.emit(true);
      },
    });
  }

  /**
   * Handle table selection changes
   */
  onSelectionChange(selected: IMemberInfoDto[]): void {
    this.selectedMember = selected || [];
    this.selectedDisplayMember = [...selected];
  }
}
