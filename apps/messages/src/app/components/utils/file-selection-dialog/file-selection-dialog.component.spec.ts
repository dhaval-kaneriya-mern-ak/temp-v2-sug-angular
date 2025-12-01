import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileSelectionDialogComponent } from './file-selection-dialog.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('FileSelectionDialogComponent - Business Rules', () => {
  let component: FileSelectionDialogComponent;
  let fixture: ComponentFixture<FileSelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileSelectionDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(FileSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Business Rule: Component Initialization', () => {
    it('should create component successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with visible false', () => {
      expect(component.visible).toBe(false);
    });

    it('should initialize with null selected file', () => {
      expect(component.selectedFile).toBeNull();
    });

    it('should have dialog configuration defined', () => {
      expect(component.dialogConfig).toBeDefined();
    });

    it('should have parent folder data as null initially', () => {
      expect(component.parentFolderData).toBeNull();
    });
  });

  describe('Business Rule: Dialog Configuration', () => {
    it('should configure dialog as modal', () => {
      expect(component.dialogConfig.modal).toBe(true);
    });

    it('should configure dialog as closable', () => {
      expect(component.dialogConfig.closable).toBe(true);
    });

    it('should allow closing on escape', () => {
      expect(component.dialogConfig.closeOnEscape).toBe(true);
    });

    it('should allow dismissing by mask click', () => {
      expect(component.dialogConfig.dismissableMask).toBe(true);
    });

    it('should position dialog at center', () => {
      expect(component.dialogConfig.position).toBe('center');
    });

    it('should set dialog width to 600px', () => {
      expect(component.dialogConfig.width).toBe('600px');
    });
  });

  describe('Business Rule: File Selection', () => {
    it('should update selected file when onFileSelection is called', () => {
      const mockFile = { id: 1, filename: 'test.pdf', isfolder: false };
      component.onFileSelection(mockFile);
      expect(component.selectedFile).toBe(mockFile);
    });

    it('should increment selectedFileVersion when file is selected', () => {
      const initialVersion = component.selectedFileVersion;
      const mockFile = { id: 1, filename: 'test.pdf', isfolder: false };
      component.onFileSelection(mockFile);
      expect(component.selectedFileVersion).toBe(initialVersion + 1);
    });
  });

  describe('Business Rule: Select File Action', () => {
    it('should emit fileSelected event with selected file', () => {
      const mockFile = { id: 1, filename: 'test.pdf', isfolder: false };
      component.selectedFile = mockFile;
      let emittedValue;
      component.fileSelected.subscribe((value) => {
        emittedValue = value;
      });

      component.selectFile();

      expect(emittedValue).toBe(mockFile);
    });

    it('should close dialog after selecting file', () => {
      const mockFile = { id: 1, filename: 'test.pdf', isfolder: false };
      component.selectedFile = mockFile;
      component.visible = true;

      component.selectFile();

      expect(component.visible).toBe(false);
    });

    it('should close dialog even without selection', () => {
      component.selectedFile = null;
      component.visible = true;

      component.selectFile();

      expect(component.visible).toBe(false);
    });
  });

  describe('Business Rule: Hide Dialog Functionality', () => {
    it('should set visible to false when hideDialog is called', () => {
      component.visible = true;
      component.hideDialog();
      expect(component.visible).toBe(false);
    });

    it('should emit visibleChange event when hiding', () => {
      component.visible = true;
      let emittedValue: boolean | undefined;
      component.visibleChange.subscribe((value) => {
        emittedValue = value;
      });

      component.hideDialog();

      expect(emittedValue).toBe(false);
    });

    it('should reset selected file when hiding', () => {
      const mockFile = { id: 1, filename: 'test.pdf', isfolder: false };
      component.selectedFile = mockFile;

      component.hideDialog();

      expect(component.selectedFile).toBeNull();
    });

    it('should reset parent folder data when hiding', () => {
      component.parentFolderData = {
        id: 1,
        title: 'Test',
        isfolder: true,
        subfolder: [],
      };

      component.hideDialog();

      expect(component.parentFolderData).toBeNull();
    });
  });

  describe('Business Rule: Folder Management', () => {
    it('should track expanded folders', () => {
      expect(component.expandedFolders).toBeDefined();
      expect(component.expandedFolders.size).toBe(0);
    });

    it('should track loading folders', () => {
      expect(component.loadingFolders).toBeDefined();
      expect(component.loadingFolders.size).toBe(0);
    });

    it('should check if folder is expanded', () => {
      const folderId = 123;
      expect(component.isFolderExpanded(folderId)).toBe(false);
    });

    it('should check if folder is loading', () => {
      const folderId = 123;
      expect(component.isLoadingFolder(folderId)).toBe(false);
    });
  });

  describe('Business Rule: File Size Formatting', () => {
    it('should format KB correctly', () => {
      expect(component.formatFileSize(500)).toBe('500 KB');
    });

    it('should format MB correctly', () => {
      expect(component.formatFileSize(2048)).toBe('2.0 MB');
    });

    it('should handle zero size', () => {
      expect(component.formatFileSize(0)).toBe('0 KB');
    });
  });

  describe('Business Rule: Visibility Management', () => {
    it('should show dialog when visible is true', () => {
      component.visible = true;
      expect(component.visible).toBe(true);
    });

    it('should hide dialog when visible is false', () => {
      component.visible = false;
      expect(component.visible).toBe(false);
    });
  });
});
