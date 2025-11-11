import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileSelectionDialogComponent } from './file-selection-dialog.component';
import { RadioCheckboxChangeEvent } from '@lumaverse/sug-ui';

describe('FileSelectionDialogComponent - Business Rules', () => {
  let component: FileSelectionDialogComponent;
  let fixture: ComponentFixture<FileSelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileSelectionDialogComponent],
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

    it('should initialize with null selected value', () => {
      expect(component.selectedValue).toBeNull();
    });

    it('should have dialog configuration defined', () => {
      expect(component.dialogConfig).toBeDefined();
    });

    it('should have predefined file selection options', () => {
      expect(component.selectFileRadioOptions).toBeDefined();
      expect(component.selectFileRadioOptions.length).toBeGreaterThan(0);
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

    it('should set dialog width to 500px', () => {
      expect(component.dialogConfig.width).toBe('500px');
    });
  });

  describe('Business Rule: File Selection Options', () => {
    it('should have uploadcomputer option', () => {
      const option = component.selectFileRadioOptions.find(
        (opt) => opt.value === 'uploadcomputer'
      );
      expect(option).toBeDefined();
    });

    it('should have geniusdrive option', () => {
      const option = component.selectFileRadioOptions.find(
        (opt) => opt.value === 'geniusdrive'
      );
      expect(option).toBeDefined();
    });

    it('should have cloudstorage option', () => {
      const option = component.selectFileRadioOptions.find(
        (opt) => opt.value === 'cloudstorage'
      );
      expect(option).toBeDefined();
    });

    it('should have three selection options', () => {
      expect(component.selectFileRadioOptions.length).toBe(3);
    });
  });

  describe('Business Rule: Handle File Selection', () => {
    it('should update selected value when handleSelection is called', () => {
      // When: Handling selection
      component.handleSelection({
        value: 'uploadcomputer',
      } as RadioCheckboxChangeEvent);

      // Then: Selected value should be updated
      expect(component.selectedValue).toBe('uploadcomputer');
    });

    it('should handle geniusdrive selection', () => {
      // When: Selecting geniusdrive
      component.handleSelection({
        value: 'geniusdrive',
      } as RadioCheckboxChangeEvent);

      // Then: Selected value should be geniusdrive
      expect(component.selectedValue).toBe('geniusdrive');
    });

    it('should handle cloudstorage selection', () => {
      // When: Selecting cloudstorage
      component.handleSelection({
        value: 'cloudstorage',
      } as RadioCheckboxChangeEvent);

      // Then: Selected value should be cloudstorage
      expect(component.selectedValue).toBe('cloudstorage');
    });

    it('should change selection when different option is selected', () => {
      // Given: Initial selection
      component.handleSelection({
        value: 'uploadcomputer',
      } as RadioCheckboxChangeEvent);

      // When: Changing selection
      component.handleSelection({
        value: 'geniusdrive',
      } as RadioCheckboxChangeEvent);

      // Then: Should update to new selection
      expect(component.selectedValue).toBe('geniusdrive');
    });
  });

  describe('Business Rule: Select File Action', () => {
    it('should emit fileSelected event with selected value', () => {
      // Given: File is selected
      component.selectedValue = 'uploadcomputer';
      let emittedValue: string | undefined;
      component.fileSelected.subscribe((value) => {
        emittedValue = value;
      });

      // When: Confirming selection
      component.selectFile();

      // Then: Event should be emitted with value
      expect(emittedValue).toBe('uploadcomputer');
    });

    it('should not emit event if no selection made', () => {
      // Given: No selection
      component.selectedValue = null;
      let eventEmitted = false;
      component.fileSelected.subscribe(() => {
        eventEmitted = true;
      });

      // When: Attempting to select file
      component.selectFile();

      // Then: Event should not be emitted
      expect(eventEmitted).toBe(false);
    });

    it('should close dialog after selecting file', () => {
      // Given: File is selected and dialog is visible
      component.selectedValue = 'geniusdrive';
      component.visible = true;

      // When: Confirming selection
      component.selectFile();

      // Then: Dialog should be closed
      expect(component.visible).toBe(false);
    });

    it('should close dialog even without selection', () => {
      // Given: No selection but dialog is visible
      component.selectedValue = null;
      component.visible = true;

      // When: Confirming selection
      component.selectFile();

      // Then: Dialog should be closed
      expect(component.visible).toBe(false);
    });
  });

  describe('Business Rule: Close Dialog Functionality', () => {
    it('should set visible to false when closeDialog is called', () => {
      // Given: Dialog is visible
      component.visible = true;

      // When: Closing dialog
      component.closeDialog();

      // Then: Dialog should be hidden
      expect(component.visible).toBe(false);
    });

    it('should emit visibleChange event when closing', () => {
      // Given: Dialog is visible
      component.visible = true;
      let emittedValue: boolean | undefined;
      component.visibleChange.subscribe((value) => {
        emittedValue = value;
      });

      // When: Closing dialog
      component.closeDialog();

      // Then: Event should emit false
      expect(emittedValue).toBe(false);
    });

    it('should reset selected value when closing', () => {
      // Given: File is selected
      component.selectedValue = 'uploadcomputer';

      // When: Closing dialog
      component.closeDialog();

      // Then: Selected value should be reset
      expect(component.selectedValue).toBeNull();
    });

    it('should reset selection when dialog is cancelled', () => {
      // Given: Dialog with selection
      component.selectedValue = 'geniusdrive';
      component.visible = true;

      // When: Closing without confirming
      component.closeDialog();

      // Then: Selection should be cleared
      expect(component.selectedValue).toBeNull();
    });
  });

  describe('Business Rule: Dialog State Management', () => {
    it('should maintain selection until confirmed or cancelled', () => {
      // When: Making selection
      component.handleSelection({
        value: 'uploadcomputer',
      } as RadioCheckboxChangeEvent);

      // Then: Selection should persist
      expect(component.selectedValue).toBe('uploadcomputer');

      // When: Changing mind
      component.handleSelection({
        value: 'cloudstorage',
      } as RadioCheckboxChangeEvent);

      // Then: Selection should update
      expect(component.selectedValue).toBe('cloudstorage');
    });

    it('should clear state on close', () => {
      // Given: Dialog with state
      component.selectedValue = 'uploadcomputer';
      component.visible = true;

      // When: Closing
      component.closeDialog();

      // Then: State should be cleared
      expect(component.selectedValue).toBeNull();
      expect(component.visible).toBe(false);
    });
  });

  describe('Business Rule: Visibility Management', () => {
    it('should show dialog when visible is true', () => {
      // When: Setting visible
      component.visible = true;

      // Then: Dialog should be visible
      expect(component.visible).toBe(true);
    });

    it('should hide dialog when visible is false', () => {
      // When: Setting not visible
      component.visible = false;

      // Then: Dialog should be hidden
      expect(component.visible).toBe(false);
    });
  });
});
