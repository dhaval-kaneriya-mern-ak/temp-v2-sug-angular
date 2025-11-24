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
import { format } from 'date-fns';
import {
  IRecipient,
  DateSlot,
  DateSlotDisplay,
  ISignUpItem,
} from '@services/interfaces/messages-interface/compose.interface';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'sug-date-slots-selection',
  standalone: true,
  imports: [
    CommonModule,
    SugUiDialogComponent,
    SugUiButtonComponent,
    SugUiTableComponent,
    SugUiLoadingSpinnerComponent,
  ],
  templateUrl: './date-slots-selection.component.html',
  styleUrls: ['../../compose/compose_email/compose-email.scss'],
})
export class DateSlotsSelectionComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() selectedSignups: ISignUpItem[] = [];
  @Input() selectedDateSlots: Array<{
    slotitemid: number;
    starttime: string;
    item: string;
    location: string;
    qtytaken: number;
    qtyremaining: number;
    signedupmembers: string;
  }> = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() slotsSelected = new EventEmitter<void>();
  @Output() selectedDateSlotsChange = new EventEmitter<
    Array<{
      slotitemid: number;
      starttime: string;
      item: string;
      location: string;
      qtytaken: number;
      qtyremaining: number;
      signedupmembers: string;
    }>
  >();
  @Output() recipientCountChange = new EventEmitter<number>();
  @Output() recipientsChange = new EventEmitter<IRecipient[]>();

  private toastr = inject(ToastrService);
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
      field: 'starttime',
      header: 'Date',
      sortable: true,
      filterable: false,
    },
    {
      field: 'item',
      header: 'Slots',
      sortable: true,
      filterable: false,
    },
    {
      field: 'signedupmembers',
      header: 'Signed Up',
      sortable: false,
      filterable: false,
    },
  ];

  tableConfig: ISugTableConfig = {
    selectionMode: 'multiple',
    dataKey: 'slotitemid',
  };

  tableData: DateSlotDisplay[] = [];
  fullSlotData: DateSlot[] = [];
  selectedSlots: DateSlot[] = [];
  selectedDisplaySlots: DateSlotDisplay[] = [];
  currentPage = 1;
  pageSize = 100;
  totalPages = 1;
  sortBy = 'itemorder,item,starttime';

  ngOnInit(): void {
    // Pre-load selected slots if any - convert from state service type to full type
    const savedSlots = this.selectedDateSlots;
    if (savedSlots.length > 0 && this.fullSlotData.length > 0) {
      const savedIds = savedSlots.map((s) => s.slotitemid);
      this.selectedSlots = this.fullSlotData.filter((slot) =>
        savedIds.includes(slot.slotitemid)
      );
      // Update display selection
      this.selectedDisplaySlots = this.tableData.filter(
        (display) =>
          savedIds.includes(display.slotitemid) ||
          (display.isWaitlistedRow &&
            display.originalSlot &&
            savedIds.includes(display.originalSlot.slotitemid))
      );
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload data when dialog becomes visible
    if (
      changes['visible'] &&
      changes['visible'].currentValue === true &&
      !changes['visible'].firstChange
    ) {
      this.loadDateSlots();
    }
  }

  openDialog(): void {
    this.loadDateSlots();
  }

  closeDialog(cancelled: boolean): void {
    if (cancelled) {
      // Close dialog immediately
      this.visible = false;
      this.visibleChange.emit(false);

      // Use setTimeout to restore state after dialog closes
      setTimeout(() => {
        const savedSlots = this.selectedDateSlots;
        if (savedSlots.length > 0) {
          const savedIds = savedSlots.map((s) => s.slotitemid);
          this.selectedSlots = this.fullSlotData.filter((slot) =>
            savedIds.includes(slot.slotitemid)
          );
          this.selectedDisplaySlots = this.tableData.filter(
            (display) =>
              savedIds.includes(display.slotitemid) ||
              (display.isWaitlistedRow &&
                display.originalSlot &&
                savedIds.includes(display.originalSlot.slotitemid))
          );
        } else {
          // No saved slots, clear selections
          this.selectedSlots = [];
          this.selectedDisplaySlots = [];
        }
      }, 0);
    } else if (this.selectedSlots.length > 0) {
      // Convert selected slots to state service format
      const slotsForState = this.selectedSlots.map((slot) => ({
        slotitemid: slot.slotitemid,
        starttime: slot.starttime
          ? format(
              new Date(Number(slot.starttime) * 1000),
              'M/d/yyyy - h:mmaaa'
            )
          : '',
        item: slot.item,
        location: slot.location || '',
        qtytaken: slot.qtytaken,
        qtyremaining: slot.qtyremaining,
        signedupmembers: slot.signedupmembers || '',
        slotid: slot.slotid,
        waitlist: slot.waitlist,
        waitlistedmembers: slot.waitlistedmembers,
      }));

      // For "People I will select" with date slots, the recipient count is the number of slots selected
      const totalRecipients = this.selectedSlots.length;
      // Extract unique recipients from all selected slots for recipient details
      // Include both signed-up and waitlisted members
      const allRecipients: IRecipient[] = [];

      this.selectedSlots.forEach((slot) => {
        // Add signed-up members
        if (slot.signedupmembers) {
          const memberNames = slot.signedupmembers
            .split('||')
            .filter((name) => name.trim());
          memberNames.forEach((name) => {
            allRecipients.push({
              displayname: name.trim(),
              email: '', // Email not available in slot data
              mobile: '',
              memberid: 0,
              smsoptin: false,
            });
          });
        }

        // Add waitlisted members if they exist
        if (slot.waitlist && slot.waitlistedmembers) {
          const waitlistNames = slot.waitlistedmembers
            .split('||')
            .filter((name) => name.trim());
          waitlistNames.forEach((name) => {
            allRecipients.push({
              displayname: `${name.trim()} (Waitlist)`,
              email: '',
              mobile: '',
              memberid: 0,
              smsoptin: false,
            });
          });
        }
      });

      // Remove duplicates by name
      const uniqueRecipients = Array.from(
        new Map(allRecipients.map((r) => [r.displayname, r])).values()
      );

      // Update state with selected slots and recipient count BEFORE closing
      this.selectedDateSlotsChange.emit(slotsForState);
      this.recipientCountChange.emit(totalRecipients);
      this.recipientsChange.emit(uniqueRecipients);

      // Now close dialog and emit event
      this.visible = false;
      this.visibleChange.emit(false);
      this.slotsSelected.emit();
    } else {
      // No selections, just close
      this.visible = false;
      this.visibleChange.emit(false);
    }
  }

  /**
   * Load date slots from API
   * Implements Use Case 2: Get Slots with Signed-Up Members
   */
  private loadDateSlots(): void {
    if (this.selectedSignups.length === 0) {
      this.toastr.error('Please select a signup first', 'Error');
      return;
    }

    const signupId = this.selectedSignups[0].signupid;
    if (!signupId) {
      this.toastr.error('Invalid signup ID', 'Error');
      return;
    }

    // Reset local selections when loading fresh data
    this.selectedSlots = [];
    this.selectedDisplaySlots = [];

    this.isLoading = true;

    // API v3 format: Use Case 2 - Get Slots with Signed-Up Members
    const payload = {
      includeSignedUpMembers: true, // Include member details per API docs
      //   pagination: {
      //     page: this.currentPage,
      //     limit: this.pageSize,
      //     sortby: this.sortBy, // Default: 'itemorder,item,starttime'
      //   },
    };

    this.composeService.getDateSlots(signupId, payload).subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          // Store full slot data
          this.fullSlotData = response.data;

          // Transform for table display with waitlist support
          this.tableData = [];
          response.data.forEach((slot) => {
            // Add regular slot row
            this.tableData.push({
              slotitemid: slot.slotitemid,
              starttime: slot.starttime
                ? format(
                    new Date(Number(slot.starttime) * 1000),
                    'yyyy-MM-dd h:mmaaa'
                  )
                : '',
              item: slot.item,
              signedupmembers: this.formatSignedUpMembers(
                slot.signedupmembers || ''
              ),
              isWaitlistedRow: false,
              originalSlot: slot,
            });
          });

          // Update pagination if available
          if (response.pagination) {
            this.totalPages = response.pagination.totalPages;
          }

          // Pre-select previously selected slots from state service
          const savedSlots = this.selectedDateSlots;
          if (savedSlots.length > 0) {
            const savedIds = savedSlots.map((s) => s.slotitemid);

            // Find matching slots in fullSlotData
            this.selectedSlots = this.fullSlotData.filter((slot) =>
              savedIds.includes(slot.slotitemid)
            );

            // Update display selection to show checkboxes as checked
            this.selectedDisplaySlots = this.tableData.filter(
              (display) =>
                savedIds.includes(display.slotitemid) ||
                (display.isWaitlistedRow &&
                  display.originalSlot &&
                  savedIds.includes(display.originalSlot.slotitemid))
            );
          }
        } else {
          this.tableData = [];
          this.fullSlotData = [];
        }
        this.isLoading = false;

        // Open dialog after data is loaded successfully
        this.visible = true;
        this.visibleChange.emit(true);
      },
      error: () => {
        this.tableData = [];
        this.fullSlotData = [];
        this.isLoading = false;
        this.visible = true;
        this.visibleChange.emit(true);
      },
    });
  }

  /**
   * Format signed-up members display
   * API returns pipe-delimited string: "Name1||Name2||Name3"
   */
  private formatSignedUpMembers(members: string): string {
    if (!members) return 'None';

    const memberList = members.split('||').filter((m) => m.trim());

    if (memberList.length === 0) return 'None';
    if (memberList.length === 1) return memberList[0];
    if (memberList.length <= 3) return memberList.join(', ');

    // Show first 2 names + count of others
    return `${memberList.slice(0, 2).join(', ')} + ${
      memberList.length - 2
    } more`;
  }

  /**
   * Handle table selection changes
   */
  onSelectionChange(selected: DateSlotDisplay[]): void {
    const selectedDisplay = selected || [];

    // Create a new array reference to ensure change detection
    this.selectedDisplaySlots = [...selectedDisplay];

    // Map display items back to full slot data
    // Handle both regular slots and waitlist rows
    this.selectedSlots = selectedDisplay
      .map((display: DateSlotDisplay) => {
        // For waitlist rows, use the originalSlot reference
        if (display.isWaitlistedRow && display.originalSlot) {
          return display.originalSlot;
        }
        // For regular rows, find by slotitemid
        return this.fullSlotData.find(
          (slot) => slot.slotitemid === display.slotitemid
        );
      })
      .filter((slot): slot is DateSlot => slot !== undefined);

    // Remove duplicates (in case both regular and waitlist rows selected for same slot)
    const uniqueSlots = Array.from(
      new Map(
        this.selectedSlots.map((slot) => [slot.slotitemid, slot])
      ).values()
    );
    this.selectedSlots = uniqueSlots;
  }

  onSort(): void {
    // Handle sort event if needed
  }

  /**
   * Load next page of results
   */
  loadNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadDateSlots();
    }
  }

  /**
   * Load previous page of results
   */
  loadPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadDateSlots();
    }
  }

  /**
   * Change sort order
   */
  changeSortOrder(sortBy: string): void {
    this.sortBy = sortBy;
    this.currentPage = 1;
    this.loadDateSlots();
  }
}
