import {
  Component,
  inject,
  signal,
  OnInit,
  ViewChild,
  TemplateRef,
  AfterViewInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  SugUiTableComponent,
  ISugTableColumn,
  SugUiLoadingSpinnerComponent,
  SugUiPaginationComponent,
  SugUiSelectBoxComponent,
  ISelectOption,
  IPagination,
  SugUiButtonComponent,
  SugUiDialogComponent,
  DialogConfig,
} from '@lumaverse/sug-ui';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  takeUntil,
} from 'rxjs/operators';
import { GroupEditService, GroupMember } from './groups-edit.services';
import { GroupMembersParams } from './groups-edit.services';
import { Subject } from 'rxjs';
type SortOrder = 'ASC' | 'DESC';

@Component({
  selector: 'app-groups-edit',
  standalone: true,
  imports: [
    CommonModule,
    SugUiTableComponent,
    SugUiSelectBoxComponent,
    SugUiPaginationComponent,
    SugUiLoadingSpinnerComponent,
    ReactiveFormsModule,
    SugUiButtonComponent,
    SugUiDialogComponent,
  ],
  templateUrl: './groups-edit.html',
  styleUrls: ['./groups-edit.scss'],
})
export class GroupsEditComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private groupService = inject(GroupEditService);

  groupId = Number(this.route.snapshot.paramMap.get('groupid'));

  tableData = signal<GroupMember[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  paginationKey = 'group-edit-pagination';
  paginationOptions = signal<IPagination>({
    totalRecords: 0,
    rows: 10,
    first: 0,
    pageSizes: [10, 25, 50, 100],
  });
  isDeleteDialogVisible = false;
  selectedMemberToDelete?: GroupMember;
  private programmaticSortUpdate = false;

  // Dialog configuration
  deletedialogConf: DialogConfig = {
    modal: true,
    draggable: true,
    resizable: false,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    focusOnShow: true,
    position: 'center',
    appendTo: 'body',
  };

  // -------------------------
  // Sorting
  // -------------------------
  sortByOptions: ISelectOption[] = [
    {
      label: 'Name',
      value: 'firstname',
      command: () => this.onSortBySelected('firstname'),
    },
    {
      label: 'Email',
      value: 'email',
      command: () => this.onSortBySelected('email'),
    },
  ];

  sortOrderOptions: ISelectOption[] = [
    {
      label: 'A to Z',
      value: 'ASC',
      command: () => this.onSortOrderSelected('ASC'),
    },
    {
      label: 'Z to A',
      value: 'DESC',
      command: () => this.onSortOrderSelected('DESC'),
    },
  ];

  searchControl = new FormControl('');
  selectedSortBy = this.sortByOptions[1];
  selectedSortOrder = this.sortOrderOptions[0];
  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
  @ViewChild('actionTemplate') actionTemplate!: TemplateRef<any>;

  tableColumns = signal<ISugTableColumn[]>([]);

  private lastSortBy: string | null = null;
  private lastSortOrder: SortOrder | null = null;
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.lastSortBy = this.selectedSortBy.value;
    this.lastSortOrder = this.selectedSortOrder.value as SortOrder;

    this.loadMembers();

    this.searchControl.valueChanges
      .pipe(
        map((v) => v?.trim() ?? ''),
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => this.onSearchChange(value));
  }
  ngAfterViewInit() {
    this.tableColumns.set([
      {
        field: 'name',
        header: 'Name',
        sortable: true,
        filterable: false,
        bodyTemplate: this.nameTemplate,
      },
      {
        field: 'email',
        header: 'Email',
        sortable: true,
        filterable: false,
      },
      {
        field: 'action',
        header: ' ',
        sortable: false,
        filterable: false,
        bodyTemplate: this.actionTemplate,
      },
    ]);
    this.cdr.detectChanges();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMembers(searchQuery = ''): void {
    if (!this.groupId) {
      this.error.set('Group ID not found');
      return;
    }

    this.isLoading.set(true);

    const currentPage =
      Math.floor(
        this.paginationOptions().first / this.paginationOptions().rows
      ) + 1;

    const pageSize = this.paginationOptions().rows;
    const sortBy = this.selectedSortBy.value;
    const sortOrder = this.selectedSortOrder.value;

    const params: GroupMembersParams = {
      page: currentPage,
      limit: pageSize,
      sortby: sortBy,
      sort: sortOrder,
      search: searchQuery,
    };

    this.groupService.getGroupMembers(this.groupId, params).subscribe({
      next: (response) => {
        // Get members array
        const members = Array.isArray(response.data.members)
          ? response.data.members
          : [];

        const mappedMembers = members.map((m) => {
          const firstName = m.firstname ?? '';
          const lastName = m.lastname ?? '';

          const initials = (
            firstName.charAt(0) + lastName.charAt(0)
          ).toUpperCase();

          // let profilePicUrl: string | null = null;
          let showImage = false;

          try {
            const picData = m.profilepicdata
              ? JSON.parse(m.profilepicdata)
              : null;
            if (picData?.type === 'customimage' && picData?.value) {
              // profilePicUrl = this.buildProfileImageUrl(m.communitymemberid);
              showImage = true; // use the image from API
            }
          } catch {
            // JSON parse failed or invalid, fallback to local rendering
          }

          return {
            ...m,
            initials,
            // profilePicUrl, // null if no API image
            showImage, // false if fallback
          };
        });

        this.tableData.set(mappedMembers);

        // Update pagination
        this.paginationOptions.update((p) => ({
          ...p,
          totalRecords: response.pagination?.totalRecords ?? 0,
          first: (currentPage - 1) * p.rows,
        }));

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading members:', err);
        this.isLoading.set(false);
        this.error.set('Failed to load members');
      },
    });
  }
  // private buildProfileImageUrl(memberId: number, size = 30): string {
  //   const refresh = Math.random();
  //   return `https://s3.amazonaws.com/testimages.signupgenius.com/memberImages/profile/${memberId}/profilepic_${size}.png?${refresh}`;
  // }

  private applySorting(sortBy: string, sortOrder: SortOrder) {
    if (this.lastSortBy === sortBy && this.lastSortOrder === sortOrder) {
      return;
    }

    this.lastSortBy = sortBy;
    this.lastSortOrder = sortOrder;

    this.programmaticSortUpdate = true;

    this.selectedSortBy =
      this.sortByOptions.find((o) => o.value === sortBy) ??
      this.sortByOptions[0];

    this.selectedSortOrder =
      this.sortOrderOptions.find((o) => o.value === sortOrder) ??
      this.sortOrderOptions[0];

    this.paginationOptions.update((p) => ({ ...p, first: 0 }));
    this.loadMembers(this.searchControl.value ?? '');

    queueMicrotask(() => {
      this.programmaticSortUpdate = false;
    });
  }

  onTableHeaderSort(event: { field: string; order: number }) {
    const rawField = event.field;
    const nextSortOrder: 'ASC' | 'DESC' = event.order === 1 ? 'ASC' : 'DESC';

    // Map UI field to API field when necessary (table shows `name` but API expects `firstname`)
    const apiField = rawField === 'name' ? 'firstname' : rawField;

    // console.log('onTableHeaderSort:', rawField, '->', apiField, nextSortOrder);
    this.applySorting(apiField, nextSortOrder);
  }

  onSearchChange(query: string): void {
    const safeQuery = query || '';

    this.paginationOptions.update((p) => ({
      ...p,
      first: 0,
    }));

    this.loadMembers(safeQuery);
  }
  onSortBySelected(value: string): void {
    if (this.programmaticSortUpdate) return;

    this.applySorting(value, this.selectedSortOrder.value as SortOrder);
  }

  onSortOrderSelected(value: string): void {
    if (this.programmaticSortUpdate) return;

    this.applySorting(this.selectedSortBy.value, value as SortOrder);
  }

  onPaginationChange(pagination: IPagination): void {
    this.paginationOptions.set(pagination);
    this.loadMembers(this.searchControl.value ?? '');
  }

  openDeleteDialog(member: GroupMember) {
    this.selectedMemberToDelete = member;
    this.isDeleteDialogVisible = true;
  }

  confirmDeleteMember() {
    if (!this.selectedMemberToDelete?.id) return;

    this.isLoading.set(true);

    this.groupService
      .deleteGroupMember(this.groupId, this.selectedMemberToDelete.id)
      .subscribe({
        next: () => {
          // Close dialog
          this.isDeleteDialogVisible = false;

          // Reload members after deletion
          this.loadMembers(this.searchControl.value ?? '');

          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to delete group:', err);
          this.isLoading.set(false);
          // Optionally show error toast
        },
      });
  }
}
