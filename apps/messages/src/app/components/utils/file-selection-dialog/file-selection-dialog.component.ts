import { CommonModule } from '@angular/common';
import {
  Component,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  DestroyRef,
  EventEmitter,
  effect,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  SugUiDialogComponent,
  SugUiButtonComponent,
  SugUiRadioCheckboxButtonComponent,
  SugUiLoadingSpinnerComponent,
  RadioCheckboxChangeEvent,
  DialogConfig,
} from '@lumaverse/sug-ui';
import { ComposeService } from '../../compose/compose.service';
import { IFileItem, IParentFolder } from '@services/interfaces';

@Component({
  selector: 'sug-file-selection-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SugUiDialogComponent,
    SugUiButtonComponent,
    SugUiRadioCheckboxButtonComponent,
    SugUiLoadingSpinnerComponent,
  ],
  templateUrl: './file-selection-dialog.component.html',
  styleUrls: ['./file-selection-dialog.component.scss'],
})
export class FileSelectionDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() fileSelected = new EventEmitter<IFileItem>();

  protected composeService = inject(ComposeService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  parentFolderData: IParentFolder | null = null;

  selectedFile: IFileItem | null = null;

  selectedFileVersion = 0;

  expandedFolders: Map<number, IParentFolder> = new Map();
  expandedSubfolders: Map<string, IParentFolder> = new Map();
  loadingFolders: Set<number> = new Set();
  loadingNestedFolders: Set<string> = new Set();
  isLoadingParentFolder = false;

  currentFolderData: IParentFolder | null = null;

  private visibleSignal = signal(false);

  dialogConfig: DialogConfig = {
    modal: true,
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
    position: 'center',
    width: '600px',
  };

  constructor() {
    // Watch for visibility changes using effect
    effect(() => {
      const currentVisible = this.visibleSignal();
      if (currentVisible) {
        // Dialog just opened
        this.loadParentFolder();
      } else {
        // Dialog just closed
        this.resetDialogData();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Sync the visible input to the signal
    if (changes['visible']) {
      this.visibleSignal.set(this.visible);
    }
  }

  private resetDialogData(): void {
    this.parentFolderData = null;
    this.selectedFile = null;
    this.selectedFileVersion = 0;
    this.expandedFolders.clear();
    this.expandedSubfolders.clear();
    this.isLoadingParentFolder = false;
  }

  loadParentFolder(): void {
    this.isLoadingParentFolder = true;
    this.composeService
      .getParentFolderData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.data && response.success) {
            this.parentFolderData = response?.data;
          }
          this.isLoadingParentFolder = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoadingParentFolder = false;
          this.cdr.markForCheck();
        },
      });
  }

  loadSubFolderData(id: number): void {
    this.loadingFolders.add(id);
    this.composeService
      .getFolderContents(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.data && response.success) {
            this.expandedFolders.set(id, response.data);
          }
          this.loadingFolders.delete(id);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingFolders.delete(id);
          this.cdr.markForCheck();
        },
      });
  }

  get folders(): IFileItem[] {
    if (!this.parentFolderData?.subfolder) return [];
    return this.parentFolderData.subfolder.filter((item) => item.isfolder);
  }

  get files(): IFileItem[] {
    if (!this.parentFolderData?.subfolder) return [];
    return this.parentFolderData.subfolder.filter((item) => !item.isfolder);
  }

  get rootTitle(): string {
    return this.parentFolderData?.title || 'GeniusDrive';
  }

  get fileOptions() {
    return this.files.map((file) => ({
      label: this.getFileDisplayName(file),
      value: file.id,
      icon: file.icon,
      description: file.filedescription,
      size: this.formatFileSize(file.filesizekb || 0),
    }));
  }

  getSubFolderFileOptions(folderId: number) {
    return this.getSubFolderFiles(folderId).map((file) => ({
      label: this.getFileDisplayName(file),
      value: file.id,
      icon: file.icon,
      description: file.filedescription,
      size: this.formatFileSize(file.filesizekb || 0),
    }));
  }

  getNestedSubFolderFileOptions(key: string) {
    return this.getNestedSubFolderFiles(key).map((file) => ({
      label: this.getFileDisplayName(file),
      value: file.id,
      icon: file.icon,
      description: file.filedescription,
      size: this.formatFileSize(file.filesizekb || 0),
    }));
  }

  private getFileDisplayName(file: IFileItem): string {
    return file.title || file.filename || 'Unnamed File';
  }

  onFileSelection(file: IFileItem): void {
    this.selectedFile = file;
    this.selectedFileVersion++;
    this.cdr.markForCheck();
  }

  onFileSelectionChange(event: RadioCheckboxChangeEvent): void {
    // First search in root-level files
    let selectedFile = this.files.find((file) => file.id === event.value);

    // If not found in root, search in subfolder files
    if (!selectedFile) {
      for (const folderData of this.expandedFolders.values()) {
        selectedFile = folderData.subfolder?.find(
          (file) => file.id === event.value && !file.isfolder
        );
        if (selectedFile) break;
      }
    }

    // If still not found, search in nested subfolder files
    if (!selectedFile) {
      for (const folderData of this.expandedSubfolders.values()) {
        selectedFile = folderData.subfolder?.find(
          (file) => file.id === event.value && !file.isfolder
        );
        if (selectedFile) break;
      }
    }

    if (selectedFile) {
      this.onFileSelection(selectedFile);
    }
  }

  selectFile(): void {
    if (this.selectedFile) {
      this.fileSelected.emit(this.selectedFile);
    }
    this.hideDialog();
  }

  formatFileSize(sizeInKb: number): string {
    if (sizeInKb < 1024) {
      return `${sizeInKb} KB`;
    } else {
      const sizeInMb = (sizeInKb / 1024).toFixed(1);
      return `${sizeInMb} MB`;
    }
  }

  getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toUpperCase();
    return extension || 'FILE';
  }

  onFolderClick(folder: IFileItem, parentFolderId?: number): void {
    if (parentFolderId !== undefined) {
      // This is a nested subfolder
      const key = this.getNestedFolderKey(parentFolderId, folder.id);
      if (this.isNestedFolderExpanded(key)) {
        this.expandedSubfolders.delete(key);
      } else {
        this.loadNestedSubFolderData(folder.id, key);
      }
    } else {
      // This is a root-level folder
      if (this.isFolderExpanded(folder.id)) {
        this.expandedFolders.delete(folder.id);
      } else {
        this.loadSubFolderData(folder.id);
      }
    }
  }

  isLoadingFolder(folderId: number): boolean {
    return this.loadingFolders.has(folderId);
  }

  isLoadingNestedFolder(key: string): boolean {
    return this.loadingNestedFolders.has(key);
  }

  isFolderExpanded(folderId: number): boolean {
    return this.expandedFolders.has(folderId);
  }

  getExpandedFolderContents(folderId: number) {
    return this.expandedFolders.get(folderId);
  }

  getSubFolderFiles(folderId: number): IFileItem[] {
    const folderData = this.expandedFolders.get(folderId);
    if (!folderData?.subfolder) return [];
    return folderData.subfolder.filter((item) => !item.isfolder);
  }

  getSubFolders(folderId: number): IFileItem[] {
    const folderData = this.expandedFolders.get(folderId);
    if (!folderData?.subfolder) return [];
    return folderData.subfolder.filter((item) => item.isfolder);
  }

  getNestedFolderKey(parentId: number, subfolderId: number): string {
    return `${parentId}-${subfolderId}`;
  }

  isNestedFolderExpanded(key: string): boolean {
    return this.expandedSubfolders.has(key);
  }

  loadNestedSubFolderData(id: number, key: string): void {
    this.loadingNestedFolders.add(key);
    this.composeService
      .getFolderContents(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.data && response.success) {
            this.expandedSubfolders.set(key, response.data);
          }
          this.loadingNestedFolders.delete(key);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingNestedFolders.delete(key);
          this.cdr.markForCheck();
        },
      });
  }

  getNestedSubFolders(parentFolderId: number, key: string): IFileItem[] {
    const folderData = this.expandedSubfolders.get(key);
    if (!folderData?.subfolder) return [];
    return folderData.subfolder.filter((item) => item.isfolder);
  }

  getNestedSubFolderFiles(key: string): IFileItem[] {
    const folderData = this.expandedSubfolders.get(key);
    if (!folderData?.subfolder) return [];
    return folderData.subfolder.filter((item) => !item.isfolder);
  }

  hideDialog(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    // Reset data immediately
    this.resetDialogData();
  }
}
