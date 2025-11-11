import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpDialogComponent } from './help-dialog.component';

describe('HelpDialogComponent - Business Rules', () => {
  let component: HelpDialogComponent;
  let fixture: ComponentFixture<HelpDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpDialogComponent);
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

    it('should have default title "Help"', () => {
      expect(component.title).toBe('Help');
    });

    it('should have dialog configuration defined', () => {
      expect(component.dialogConfig).toBeDefined();
    });
  });

  describe('Business Rule: Dialog Configuration', () => {
    it('should configure dialog as modal', () => {
      expect(component.dialogConfig.modal).toBe(true);
    });

    it('should configure dialog as closable', () => {
      expect(component.dialogConfig.closable).toBe(true);
    });

    it('should allow closing on escape key', () => {
      expect(component.dialogConfig.closeOnEscape).toBe(true);
    });

    it('should allow dismissing by clicking mask', () => {
      expect(component.dialogConfig.dismissableMask).toBe(true);
    });

    it('should position dialog at center', () => {
      expect(component.dialogConfig.position).toBe('center');
    });

    it('should set dialog width to 850px', () => {
      expect(component.dialogConfig.width).toBe('850px');
    });
  });

  describe('Business Rule: Title Customization', () => {
    it('should accept custom title input', () => {
      // When: Setting custom title
      component.title = 'Custom Help Title';

      // Then: Title should be updated
      expect(component.title).toBe('Custom Help Title');
    });

    it('should accept empty title', () => {
      // When: Setting empty title
      component.title = '';

      // Then: Title should be empty
      expect(component.title).toBe('');
    });

    it('should accept long title', () => {
      // When: Setting long title
      const longTitle = 'This is a very long help title that should still work';
      component.title = longTitle;

      // Then: Title should be set
      expect(component.title).toBe(longTitle);
    });
  });

  describe('Business Rule: Visibility Management', () => {
    it('should show dialog when visible is true', () => {
      // When: Setting visible to true
      component.visible = true;

      // Then: Dialog should be visible
      expect(component.visible).toBe(true);
    });

    it('should hide dialog when visible is false', () => {
      // When: Setting visible to false
      component.visible = false;

      // Then: Dialog should be hidden
      expect(component.visible).toBe(false);
    });

    it('should toggle visibility', () => {
      // Given: Dialog is hidden
      component.visible = false;

      // When: Showing dialog
      component.visible = true;
      expect(component.visible).toBe(true);

      // When: Hiding dialog again
      component.visible = false;
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
      // Given: Dialog is visible and event spy
      component.visible = true;
      let emittedValue: boolean | undefined;
      component.visibleChange.subscribe((visible) => {
        emittedValue = visible;
      });

      // When: Closing dialog
      component.closeDialog();

      // Then: Event should emit false
      expect(emittedValue).toBe(false);
    });

    it('should emit visibleChange with false value', () => {
      // Given: Event spy
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

  describe('Business Rule: Two-way Binding Support', () => {
    it('should support visibleChange output for two-way binding', () => {
      // Then: visibleChange EventEmitter should exist
      expect(component.visibleChange).toBeDefined();
    });

    it('should emit when visibility changes', () => {
      // Given: Event listener
      let emittedValue: boolean | undefined;
      component.visibleChange.subscribe((value) => {
        emittedValue = value;
      });

      // When: Closing dialog
      component.closeDialog();

      // Then: Value should be emitted
      expect(emittedValue).toBe(false);
    });
  });

  describe('Business Rule: Content Projection', () => {
    it('should be reusable with different titles', () => {
      // When: Setting different titles
      component.title = 'FAQ';
      expect(component.title).toBe('FAQ');

      component.title = 'About';
      expect(component.title).toBe('About');

      component.title = 'Instructions';
      expect(component.title).toBe('Instructions');
    });
  });
});
