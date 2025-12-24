import {
  Component,
  inject,
  signal,
  OnInit,
  TemplateRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SugUiTableComponent,
  ISugTableColumn,
  SugUiSelectBoxComponent,
  ISelectOption,
  SugUiPaginationComponent,
  IPagination,
  SugUiLoadingSpinnerComponent,
  SugUiButtonComponent,
  SugUiDialogComponent,
  DialogConfig,
  SugUiListActionDropdownComponent,
} from '@lumaverse/sug-ui';
import { GroupsService, IGroup } from './groups.service';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { MenuItem } from 'primeng/api';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
type SortOrder = 'ASC' | 'DESC';

@Component({
  selector: 'app-groups-list',
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
    SugUiListActionDropdownComponent,
  ],
  templateUrl: './groups-list.html',
  styleUrls: ['./groups-list.scss'],
})
export class GroupsListComponent implements OnInit, AfterViewInit, OnDestroy {
  private groupsService = inject(GroupsService);

  tableData = signal<IGroup[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  isAddGroupVisible = false;
  isDeleteDialogVisible = false;
  selectedGroupToDelete: IGroup | null = null;

  paginationKey = 'group-pagination';
  paginationOptions = signal<IPagination>({
    totalRecords: 0,
    rows: 10,
    first: 0,
    pageSizes: [10, 25, 50, 100],
  });

  getMoreActionItems(rowData: any): MenuItem[] {
    return [
      {
        label: 'Transfer',
        icon: 'fa-solid fa-right-left',
        command: () => this.transferGroup(rowData),
      },
      {
        label: 'Merge',
        icon: 'fa-solid fa-object-group',
        command: () => this.mergeGroup(rowData),
      },
      {
        label: 'Duplicate',
        icon: 'fa-solid fa-clone',
        command: () => this.duplicateGroup(rowData),
      },
    ];
  }

  sortByOptions: ISelectOption[] = [
    {
      label: 'Group Name',
      value: 'title',
      command: () => this.onSortBySelected('title'),
    },
    {
      label: 'Members',
      value: 'membercount',
      command: () => this.onSortBySelected('membercount'),
    },
    {
      label: 'Sign Ups',
      value: 'signupcount',
      command: () => this.onSortBySelected('signupcount'),
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
  get currentSortOrderOptions(): ISelectOption[] {
    const numericFields = ['membercount', 'signupcount'];
    if (numericFields.includes(this.selectedSortBy.value)) {
      return [
        {
          label: 'Lowest to Highest',
          value: 'ASC',
          command: () => this.onSortOrderSelected('ASC'),
        },
        {
          label: 'Highest to Lowest',
          value: 'DESC',
          command: () => this.onSortOrderSelected('DESC'),
        },
      ];
    }
    return [
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
  }

  searchControl = new FormControl('');
  selectedSortBy = this.sortByOptions[2];
  selectedSortOrder = this.sortOrderOptions[1];

  @ViewChild('memberTemplate', { static: true })
  memberTemplate!: TemplateRef<any>;

  @ViewChild('signupTemplate', { static: true })
  signupTemplate!: TemplateRef<any>;

  tableColumns = signal<ISugTableColumn[]>([]);
  private cdr = inject(ChangeDetectorRef);

  dialogConf: DialogConfig = {
    modal: true,
    draggable: true,
    resizable: false,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    focusOnShow: true,
    position: 'center',
    appendTo: 'body',
    width: '767px',
  };
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
  private fb = inject(FormBuilder);
  private router = inject(Router);
  addGroupForm = this.fb.group({
    groupName: ['', Validators.required],
  });
  private suppressSortCommand = false;
  private lastSortBy: string | null = null;
  private lastSortOrder: SortOrder | null = null;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.lastSortBy = this.selectedSortBy.value;
    this.lastSortOrder = this.selectedSortOrder.value as SortOrder;
    this.loadGroups();
    this.searchControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.onSearchChange(value ?? '');
      });
  }
  ngAfterViewInit() {
    this.tableColumns.set([
      {
        field: 'title',
        header: 'Group Name',
        filterable: false,
      },
      {
        field: 'membercount',
        header: 'Members',
        filterable: false,
        bodyTemplate: this.memberTemplate,
      },
      {
        field: 'signupcount',
        header: 'Sign Ups',
        filterable: false,
        bodyTemplate: this.signupTemplate,
      },
      {
        field: 'action',
        header: ' ',
        sortable: false,
        filterable: false,
      },
    ]);
    this.cdr.detectChanges();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  loadGroups(searchQuery = ''): void {
    this.isLoading.set(true);

    const currentPage =
      Math.floor(
        this.paginationOptions().first / this.paginationOptions().rows
      ) + 1;

    const pageSize = this.paginationOptions().rows;
    const sortBy = this.selectedSortBy.value;
    const sortOrder = this.selectedSortOrder.value;

    this.groupsService
      .getAllGroupsPaginated(
        currentPage,
        pageSize,
        sortBy,
        sortOrder,
        searchQuery
      )
      .subscribe({
        next: (response) => {
          this.tableData.set(response.data ?? []);

          this.paginationOptions.update((p) => ({
            ...p,
            totalRecords: response.pagination.totalRecords,
            first: (response.pagination.currentPage - 1) * p.rows,
          }));

          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }
  private applySorting(sortBy: string, sortOrder: SortOrder) {
    const actualSortOrder = this.getSortOrderForField(sortBy, sortOrder);

    if (this.lastSortBy === sortBy && this.lastSortOrder === actualSortOrder) {
      return;
    }

    this.lastSortBy = sortBy;
    this.lastSortOrder = actualSortOrder;

    this.suppressSortCommand = true;

    this.selectedSortBy =
      this.sortByOptions.find((o) => o.value === sortBy) ??
      this.sortByOptions[0];

    this.selectedSortOrder =
      this.currentSortOrderOptions.find((o) => o.value === actualSortOrder) ??
      this.currentSortOrderOptions[0];

    this.paginationOptions.update((p) => ({ ...p, first: 0 }));

    this.loadGroups(this.searchControl.value ?? '');

    queueMicrotask(() => {
      this.suppressSortCommand = false;
    });
  }

  private getSortOrderForField(
    field: string,
    selectedOrder: SortOrder
  ): SortOrder {
    const numericFields = ['membercount', 'signupcount'];

    if (numericFields.includes(field)) {
      return selectedOrder === 'ASC' ? 'ASC' : 'DESC';
    }

    return selectedOrder;
  }

  onTableHeaderSort(event: { field: string; order: number }) {
    const field = event.field;
    const nextSortOrder: 'ASC' | 'DESC' = event.order === 1 ? 'ASC' : 'DESC';

    this.applySorting(field, nextSortOrder);
  }

  addGroup() {
    this.isAddGroupVisible = true;
  }
  get groupNameControl() {
    return this.addGroupForm.get('groupName') as FormControl;
  }

  closeAddGroupDialog() {
    this.isAddGroupVisible = false;
    this.addGroupForm.reset();
  }

  createGroup() {
    if (this.addGroupForm.valid) {
      const payload = {
        title: this.addGroupForm.get('groupName')?.value?.trim() ?? '',
      };

      if (!payload.title) {
        this.addGroupForm.get('groupName')?.setErrors({ required: true });
        return;
      }

      this.groupsService.createGroup(payload).subscribe({
        next: (res) => {
          console.log('Group created successfully:', res);
          this.closeAddGroupDialog();
          this.loadGroups();
        },
        error: (err) => {
          console.error('Error creating group:', err);
        },
      });
    } else {
      this.addGroupForm.markAllAsTouched();
    }
  }

  onSearchChange(query: string): void {
    const safeQuery = query || '';

    this.paginationOptions.update((p) => ({
      ...p,
      first: 0, // Reset to first page when search changes
    }));

    this.loadGroups(safeQuery); // Pass the sanitized query
  }

  onSortBySelected(value: string): void {
    if (this.suppressSortCommand) return;

    this.selectedSortBy = this.sortByOptions.find((o) => o.value === value)!;

    this.selectedSortOrder = this.sortOrderOptions[0];

    this.applySorting(
      this.selectedSortBy.value,
      this.selectedSortOrder.value as SortOrder
    );
  }

  onSortOrderSelected(value: string): void {
    if (this.suppressSortCommand) return;

    this.applySorting(this.selectedSortBy.value, value as SortOrder);
  }

  onPaginationChange(pagination: IPagination): void {
    this.paginationOptions.set(pagination);
    this.loadGroups();
  }

  editGroup(group: IGroup): void {
    this.router.navigate(['/groups/edit', group.id], {
      state: { data: group },
    });
  }

  deleteGroup(group: IGroup): void {
    this.selectedGroupToDelete = group;
    this.isDeleteDialogVisible = true;
  }
  confirmDeleteGroup(): void {
    if (!this.selectedGroupToDelete) return;

    const groupId = this.selectedGroupToDelete.id;

    this.groupsService.deleteGroup(groupId).subscribe({
      next: () => {
        this.isDeleteDialogVisible = false;
        this.selectedGroupToDelete = null;
        this.loadGroups(); // refresh list
      },
      error: (err) => {
        console.error('Delete failed', err);
      },
    });
  }
  cancelDelete(): void {
    this.isDeleteDialogVisible = false;
    this.selectedGroupToDelete = null;
  }

  transferGroup(rowData: any) {
    console.log('Transfer', rowData);
  }

  mergeGroup(rowData: any) {
    console.log('Merge', rowData);
  }

  duplicateGroup(rowData: any) {
    console.log('Duplicate', rowData);
  }
}
