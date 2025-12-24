import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SugUiDialogComponent,
  SugUiButtonComponent,
  SugUiTableComponent,
  DialogConfig,
  SugUiLoadingSpinnerComponent,
  SugUiRadioCheckboxButtonComponent,
  ISugTableConfig,
  ISugTableColumn,
} from '@lumaverse/sug-ui';
import { ComposeService } from '../../compose/compose.service';
import { IGroupMember } from '@services/interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'sug-update-group-section',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SugUiDialogComponent,
    SugUiButtonComponent,
    SugUiTableComponent,
    SugUiLoadingSpinnerComponent,
    SugUiRadioCheckboxButtonComponent,
    SugUiTableComponent,
  ],
  templateUrl: './update-group-section.component.html',
  styleUrls: ['./update-group-section.component.scss'],
})
export class SugUpdateGroupSectionComponent implements OnDestroy, OnInit {
  @Input() visible = false;
  @Input() selectedGroupId?: string;
  @Output() visibleChange = new EventEmitter<boolean>();
  stateService = inject(ComposeService);
  private groupMembersSub?: Subscription;
  tableConfig: ISugTableConfig = {
    selectionMode: 'multiple',
    dataKey: 'id',
  };

  tableColumns: ISugTableColumn[] = [
    {
      field: 'email',
      header: 'Email',
      filterable: false,
    },
    {
      field: 'memberName',
      header: 'Member Name',
      filterable: false,
    },
  ];
  isLoading = false;
  isUpdating = false;
  errorMessage = '';
  selectedRadioValue = '';
  selectedMembers: IGroupMember[] = [];
  manualEmails = '';
  needGroupEmailAlias = false;
  groupEmailAlias = '';
  selectedGroup: {
    id?: number;
    title?: string;
    members?: (IGroupMember & { memberName?: string })[];
  } = {};
  dialogConfig: DialogConfig = {
    modal: true,
    closable: false,
    closeOnEscape: false,
    dismissableMask: false,
    visible: this.visible,
    appendTo: 'body',
    position: 'center',
    width: '800px',
  };
  GroupRadioOptions = [
    { label: 'Manually Enter Emails', value: 'addManuallyEmail' },
    { label: 'Import from Address Book', value: 'importFromAddress' },
  ];

  cloudSpongeServices = [
    'gmail',
    'icloud',
    'windowslive',
    'yahoo',
    'aol',
    'csv',
  ];

  ngOnDestroy(): void {
    this.groupMembersSub?.unsubscribe();
    this.closeDialog();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.initializeGroupMembers();
  }

  initializeGroupMembers(): void {
    this.groupMembersSub = this.stateService
      .getGroupsMembers(this.selectedGroupId)
      .subscribe({
        next: (res) => {
          // Map the API response to our interface with enhanced member data
          this.selectedGroup = {
            id: res.data.id,
            title: res.data.title,
            members: (res.data.members || []).map((member: IGroupMember) => ({
              ...member,
              memberName: `${member.firstname} ${member.lastname}`.trim(),
            })),
          };
          this.isLoading = false;
        },
        error: (error) => {
          this.selectedGroup = { members: [] };
          this.isLoading = false;
          // Don't auto-close dialog on error, let user handle it
        },
      });
  }

  titleChanges(value: string): void {
    if (this.selectedGroup) {
      this.selectedGroup.title = value;
    }
  }

  closeDialog(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  updateChanges(): void {
    this.isUpdating = true;
    this.errorMessage = '';

    const apiCalls = [];

    // Collect all API calls that need to be made
    if (this.selectedGroup?.id && this.selectedGroup?.title) {
      apiCalls.push(this.updateGroupTitle());
    } else if (this.selectedGroup?.id && !this.selectedGroup?.title) {
      this.errorMessage = 'Title cannot be empty.';
      this.isUpdating = false;
      return;
    }

    if (
      this.selectedGroup?.id &&
      (this.parseManualEmails().length > 0 ||
        this.parseManualEmailsAlias().length > 0)
    ) {
      apiCalls.push(this.addMembersToGroup());
    }

    if (this.selectedGroup?.id && this.selectedMembers.length > 0) {
      apiCalls.push(this.removeSelectedMembers());
    }

    if (apiCalls.length === 0) {
      this.isUpdating = false;
      this.closeDialog();
      return;
    }

    // Execute all API calls and handle results
    Promise.allSettled(apiCalls)
      .then((results) => {
        this.isUpdating = false;

        const failures = results.filter(
          (result) => result.status === 'rejected'
        );

        if (failures.length > 0) {
          // Show error message if any API call failed
          const errorMessages = failures.map(
            (failure: PromiseRejectedResult) => {
              // Check if the error structure has the API error format with message array
              if (
                failure?.reason?.error?.message &&
                Array.isArray(failure.reason.error.message)
              ) {
                // Extract details from the API error message array
                return failure.reason.error.message
                  .map(
                    (error: {
                      details?: string;
                      message?: string;
                      code?: string;
                    }) => error.details || error.message || 'An error occurred'
                  )
                  .join(', ');
              }
              // Fallback to other error message formats
              return (
                failure?.reason?.error?.message ||
                failure?.reason?.message ||
                'An error occurred'
              );
            }
          );
          this.errorMessage = `Failed to update: ${errorMessages.join('; ')}`;
          console.error('API failures:', failures, errorMessages);
        } else {
          // All API calls succeeded, close dialog
          console.log('All updates completed successfully');
          this.closeDialog();
        }
      })
      .catch((error) => {
        this.isUpdating = false;
        this.errorMessage =
          'An unexpected error occurred while updating the group.';
        console.error('Unexpected error:', error);
      });
  }

  onRadioSelectionChange(value: string): void {
    this.selectedRadioValue = value;
    // Handle the selected option
    if (value === 'addManuallyEmail') {
      // Reset form values when switching
      this.manualEmails = '';
      this.needGroupEmailAlias = false;
      this.groupEmailAlias = '';
    } else if (value === 'importFromAddress') {
      console.log('Import from Address Book selected');
      // Show provider options, don't close dialog
    }
  }

  onProviderClick(provider: string): void {
    // Handle different providers
    console.log(`Provider selected: ${provider}`);
  }

  onGroupEmailAliasChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.needGroupEmailAlias = inputElement.checked;
    if (!inputElement.checked) {
      this.groupEmailAlias = '';
    }
  }

  /**
   * Parse manually entered emails from textarea
   * Handles comma-separated and line-separated emails
   */
  parseManualEmails(): string[] {
    if (!this.manualEmails.trim()) {
      return [];
    }

    // Split by commas and newlines, then clean up
    const emails = this.manualEmails
      .split(/[,\n\r]+/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0)
      .filter((email) => this.isValidEmail(email));

    return [...new Set(emails)]; // Remove duplicates
  }

  parseManualEmailsAlias(): string[] {
    if (!this.groupEmailAlias.trim()) {
      return [];
    }

    // Split by commas and newlines, then clean up
    const emails = this.groupEmailAlias
      .split(/[,\n\r]+/)
      .map((email) => email.trim());

    return [...new Set(emails)]; // Remove duplicates
  }

  /**
   * Basic email validation
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSelectionChange(selectedMembers: IGroupMember[]): void {
    this.selectedMembers = selectedMembers;
  }

  updateGroupTitle(): Promise<unknown> {
    if (this.selectedGroup?.id && this.selectedGroup?.title) {
      const groupId = this.selectedGroup.id;
      const groupTitle = this.selectedGroup.title;
      return new Promise((resolve, reject) => {
        this.stateService
          .updateGroupTitle(groupId.toString(), groupTitle)
          .subscribe({
            next: (response) => {
              console.log('Group title updated successfully');
              resolve(response);
            },
            error: (error) => {
              console.error('Error updating group title:', error);
              reject(error);
            },
          });
      });
    }
    return Promise.resolve(); // Return resolved promise if no update needed
  }

  removeSelectedMembers(): Promise<unknown> {
    if (this.selectedGroup?.id && this.selectedMembers.length > 0) {
      const groupId = this.selectedGroup.id;
      const memberIds = this.selectedMembers.map((member) => member.id);
      return new Promise((resolve, reject) => {
        this.stateService
          .deleteMembersFromGroup(groupId.toString(), memberIds)
          .subscribe({
            next: (response) => {
              console.log('Members removed successfully');
              resolve(response);
            },
            error: (error) => {
              console.error('Error removing members from group:', error);
              reject(error);
            },
          });
      });
    }
    return Promise.resolve(); // Return resolved promise if no removal needed
  }

  addMembersToGroup(): Promise<unknown> {
    if (
      this.selectedGroup?.id &&
      (this.parseManualEmails().length > 0 ||
        this.parseManualEmailsAlias().length > 0)
    ) {
      const groupId = this.selectedGroup.id;
      const payload = {
        groupmembers: [
          ...this.parseManualEmails().map((email) => ({ emailaddress: email })),
        ],
        alias: this.parseManualEmailsAlias(),
      };

      return new Promise((resolve, reject) => {
        this.stateService
          .addMembersToGroup(groupId.toString(), payload)
          .subscribe({
            next: (response) => {
              console.log('Members added successfully');
              resolve(response);
            },
            error: (error) => {
              console.error('Error adding members to group:', error);
              reject(error);
            },
          });
      });
    }
    return Promise.resolve(); // Return resolved promise if no addition needed
  }
}
