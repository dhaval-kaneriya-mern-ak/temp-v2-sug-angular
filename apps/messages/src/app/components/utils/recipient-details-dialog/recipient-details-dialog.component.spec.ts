import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { RecipientDetailsDialogComponent } from './recipient-details-dialog.component';

describe('RecipientDetailsDialogComponent - Business Rules', () => {
  let component: RecipientDetailsDialogComponent;
  let fixture: ComponentFixture<RecipientDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipientDetailsDialogComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipientDetailsDialogComponent);
    component = fixture.componentInstance;

    // Set @Input properties
    component.recipients = [];

    fixture.detectChanges();
  });

  describe('Business Rule: Component Initialization', () => {
    it('should create component successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with visible false', () => {
      expect(component.visible).toBe(false);
    });

    it('should have dialog configuration defined', () => {
      expect(component.dialogConfig).toBeDefined();
    });

    it('should have recipient table columns defined', () => {
      expect(component.recipientColumns).toBeDefined();
      expect(component.recipientColumns.length).toBeGreaterThan(0);
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

    it('should set dialog width to 800px', () => {
      expect(component.dialogConfig.width).toBe('800px');
    });
  });

  describe('Business Rule: Table Column Configuration', () => {
    it('should have email column', () => {
      const emailCol = component.recipientColumns.find(
        (col) => col.field === 'email'
      );
      expect(emailCol).toBeDefined();
      expect(emailCol?.header).toBe('Email');
      expect(emailCol?.sortable).toBe(true);
    });

    it('should have displayname column', () => {
      const displayNameCol = component.recipientColumns.find(
        (col) => col.field === 'displayname'
      );
      expect(displayNameCol).toBeDefined();
      expect(displayNameCol?.header).toBe('Name');
      expect(displayNameCol?.sortable).toBe(true);
    });

    it('should have two columns', () => {
      expect(component.recipientColumns.length).toBe(2);
    });

    it('should make all columns sortable', () => {
      const allSortable = component.recipientColumns.every(
        (col) => col.sortable === true
      );
      expect(allSortable).toBe(true);
    });

    it('should disable filtering on all columns', () => {
      const allNoFilter = component.recipientColumns.every(
        (col) => col.filterable === false
      );
      expect(allNoFilter).toBe(true);
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

    it('should work when closing already hidden dialog', () => {
      // Given: Dialog already hidden
      component.visible = false;

      // When: Closing dialog
      expect(() => component.closeDialog()).not.toThrow();

      // Then: Dialog should remain hidden
      expect(component.visible).toBe(false);
    });
  });

  describe('Business Rule: Table Event Handlers', () => {
    it('should have onSort method defined', () => {
      expect(component.onSort).toBeDefined();
      expect(typeof component.onSort).toBe('function');
    });

    it('should have onPage method defined', () => {
      expect(component.onPage).toBeDefined();
      expect(typeof component.onPage).toBe('function');
    });

    it('should handle sort event without errors', () => {
      // When: Sorting
      expect(() => component.onSort()).not.toThrow();
    });

    it('should handle page event without errors', () => {
      // When: Paging
      expect(() => component.onPage()).not.toThrow();
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

    it('should toggle visibility', () => {
      // Given: Dialog hidden
      component.visible = false;

      // When: Showing
      component.visible = true;
      expect(component.visible).toBe(true);

      // When: Hiding
      component.visible = false;
      expect(component.visible).toBe(false);
    });
  });

  describe('Business Rule: Two-way Binding Support', () => {
    it('should support visibleChange output', () => {
      expect(component.visibleChange).toBeDefined();
    });

    it('should emit visibility changes', () => {
      // Given: Event listener
      let emittedValue: boolean | undefined;
      component.visibleChange.subscribe((value) => {
        emittedValue = value;
      });

      // When: Closing dialog
      component.closeDialog();

      // Then: Should emit false
      expect(emittedValue).toBe(false);
    });
  });
});
