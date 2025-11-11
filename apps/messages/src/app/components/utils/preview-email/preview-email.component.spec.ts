import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreviewEmailComponent } from './preview-email.component';

describe('PreviewEmailComponent - Business Rules', () => {
  let component: PreviewEmailComponent;
  let fixture: ComponentFixture<PreviewEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewEmailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PreviewEmailComponent);
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

    it('should initialize with empty email preview', () => {
      expect(component.emailHtmlPreview).toBe('');
    });

    it('should initialize with empty themes array', () => {
      expect(component.availableThemes).toEqual([]);
    });

    it('should initialize with null selected theme', () => {
      expect(component.selectedThemeId).toBeNull();
    });

    it('should initialize with null scheduled date', () => {
      expect(component.scheduledDate).toBeNull();
    });

    it('should initialize with null scheduled time', () => {
      expect(component.scheduledTime).toBeNull();
    });

    it('should set minimum date to current date', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      component.minDate.setHours(0, 0, 0, 0);

      expect(component.minDate.getTime()).toBeGreaterThanOrEqual(
        today.getTime()
      );
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

    it('should set dialog width to 850px', () => {
      expect(component.dialogConfig.width).toBe('850px');
    });
  });

  describe('Business Rule: Send Now Functionality', () => {
    it('should emit sendNow event when onSendNow is called', () => {
      // Given: Event spy
      let eventEmitted = false;
      component.sendNow.subscribe(() => {
        eventEmitted = true;
      });

      // When: Sending now
      component.onSendNow();

      // Then: Event should be emitted
      expect(eventEmitted).toBe(true);
    });

    it('should close dialog after sending now', () => {
      // Given: Dialog is visible
      component.visible = true;

      // When: Sending now
      component.onSendNow();

      // Then: Dialog should be hidden
      expect(component.visible).toBe(false);
    });

    it('should reset dialog state after sending now', () => {
      // Given: Dialog has selections
      component.visible = true;
      component.selectedThemeId = 'theme1';
      component.scheduledDate = new Date();
      component.scheduledTime = new Date();

      // When: Sending now
      component.onSendNow();

      // Then: Dialog should be reset
      expect(component.selectedThemeId).toBeNull();
      expect(component.scheduledDate).toBeNull();
      expect(component.scheduledTime).toBeNull();
    });
  });

  describe('Business Rule: Schedule Send Functionality', () => {
    it('should emit scheduleEmail event with valid date and time', () => {
      // Given: Valid future date and time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureTime = new Date();
      futureTime.setHours(futureTime.getHours() + 2);

      component.scheduledDate = tomorrow;
      component.scheduledTime = futureTime;

      let emittedData: { date: Date; time: Date } | undefined;
      component.scheduleEmail.subscribe((data) => {
        emittedData = data;
      });

      // When: Scheduling send
      component.onScheduleSend();

      // Then: Event should be emitted with date and time
      expect(emittedData).toBeDefined();
      expect(emittedData?.date).toEqual(tomorrow);
      expect(emittedData?.time).toEqual(futureTime);
    });

    it('should not emit event if date is missing', () => {
      // Given: Missing date but has time
      component.scheduledDate = null;
      component.scheduledTime = new Date();

      let eventEmitted = false;
      component.scheduleEmail.subscribe(() => {
        eventEmitted = true;
      });

      // When: Attempting to schedule
      component.onScheduleSend();

      // Then: Event should not be emitted
      expect(eventEmitted).toBe(false);
    });

    it('should not emit event if time is missing', () => {
      // Given: Has date but missing time
      component.scheduledDate = new Date();
      component.scheduledTime = null;

      let eventEmitted = false;
      component.scheduleEmail.subscribe(() => {
        eventEmitted = true;
      });

      // When: Attempting to schedule
      component.onScheduleSend();

      // Then: Event should not be emitted
      expect(eventEmitted).toBe(false);
    });

    it('should close dialog after scheduling', () => {
      // Given: Valid future date and time
      component.visible = true;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureTime = new Date();
      futureTime.setHours(futureTime.getHours() + 2);

      component.scheduledDate = tomorrow;
      component.scheduledTime = futureTime;

      // When: Scheduling send
      component.onScheduleSend();

      // Then: Dialog should be hidden
      expect(component.visible).toBe(false);
    });
  });

  describe('Business Rule: Scheduled Date Validation', () => {
    it('should validate that scheduled date is in the future', () => {
      // Given: Future date and time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureTime = new Date();
      futureTime.setHours(14, 30);

      component.scheduledDate = tomorrow;
      component.scheduledTime = futureTime;

      // When: Validating date
      const isValid = component.isScheduledDateValid();

      // Then: Should be valid
      expect(isValid).toBe(true);
    });

    it('should invalidate past dates', () => {
      // Given: Past date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const time = new Date();
      time.setHours(14, 30);

      component.scheduledDate = yesterday;
      component.scheduledTime = time;

      // When: Validating date
      const isValid = component.isScheduledDateValid();

      // Then: Should be invalid
      expect(isValid).toBe(false);
    });

    it('should invalidate if date is missing', () => {
      // Given: Missing date
      component.scheduledDate = null;
      component.scheduledTime = new Date();

      // When: Validating date
      const isValid = component.isScheduledDateValid();

      // Then: Should be invalid
      expect(isValid).toBe(false);
    });

    it('should invalidate if time is missing', () => {
      // Given: Missing time
      component.scheduledDate = new Date();
      component.scheduledTime = null;

      // When: Validating date
      const isValid = component.isScheduledDateValid();

      // Then: Should be invalid
      expect(isValid).toBe(false);
    });

    it('should invalidate if both date and time are missing', () => {
      // Given: No date or time
      component.scheduledDate = null;
      component.scheduledTime = null;

      // When: Validating date
      const isValid = component.isScheduledDateValid();

      // Then: Should be invalid
      expect(isValid).toBe(false);
    });

    it('should combine date and time correctly for validation', () => {
      // Given: Today's date with future time (well beyond current time to avoid timing issues)
      const today = new Date();
      const futureTime = new Date();
      futureTime.setHours(23, 59, 0, 0); // Set to end of day to ensure it's in future

      component.scheduledDate = today;
      component.scheduledTime = futureTime;

      // When: Validating date
      const isValid = component.isScheduledDateValid();

      // Then: Should be valid if combined datetime is in future
      expect(isValid).toBe(true);
    });
  });

  describe('Business Rule: Theme Selection', () => {
    it('should select a theme', () => {
      // When: Selecting theme
      component.selectTheme('theme123');

      // Then: Theme should be selected
      expect(component.selectedThemeId).toBe('theme123');
    });

    it('should change selected theme', () => {
      // Given: Theme already selected
      component.selectedThemeId = 'theme1';

      // When: Selecting different theme
      component.selectTheme('theme2');

      // Then: Theme should be updated
      expect(component.selectedThemeId).toBe('theme2');
    });

    it('should accept themes array input', () => {
      // Given: Themes array
      const themes = [
        { id: '1', image: 'img1.png', name: 'Theme 1' },
        { id: '2', image: 'img2.png', name: 'Theme 2' },
      ];

      // When: Setting themes
      component.availableThemes = themes;

      // Then: Themes should be set
      expect(component.availableThemes).toEqual(themes);
      expect(component.availableThemes.length).toBe(2);
    });
  });

  describe('Business Rule: Email Preview', () => {
    it('should accept HTML email preview', () => {
      // Given: HTML content
      const htmlContent = '<h1>Test Email</h1><p>Content</p>';

      // When: Setting preview
      component.emailHtmlPreview = htmlContent;

      // Then: Preview should be set
      expect(component.emailHtmlPreview).toBe(htmlContent);
    });

    it('should handle empty preview', () => {
      // When: Setting empty preview
      component.emailHtmlPreview = '';

      // Then: Preview should be empty
      expect(component.emailHtmlPreview).toBe('');
    });

    it('should handle complex HTML preview', () => {
      // Given: Complex HTML
      const complexHtml = `
        <div style="padding: 20px;">
          <h1>Welcome</h1>
          <p>This is a <strong>test</strong> email.</p>
          <a href="http://example.com">Link</a>
        </div>
      `;

      // When: Setting preview
      component.emailHtmlPreview = complexHtml;

      // Then: Preview should be set
      expect(component.emailHtmlPreview).toBe(complexHtml);
    });
  });

  describe('Business Rule: Dialog Reset on Close', () => {
    it('should reset all fields when dialog closes', () => {
      // Given: Dialog with selections
      component.scheduledDate = new Date();
      component.scheduledTime = new Date();
      component.selectedThemeId = 'theme1';
      component.visible = true;

      // When: Sending now (which closes dialog)
      component.onSendNow();

      // Then: All fields should be reset
      expect(component.scheduledDate).toBeNull();
      expect(component.scheduledTime).toBeNull();
      expect(component.selectedThemeId).toBeNull();
    });
  });

  describe('Business Rule: Visibility Change Event', () => {
    it('should emit visibleChange when closing', () => {
      // Given: Event spy
      let emittedValue: boolean | undefined;
      component.visibleChange.subscribe((value) => {
        emittedValue = value;
      });

      component.visible = true;

      // When: Sending email (closes dialog)
      component.onSendNow();

      // Then: Should emit false
      expect(emittedValue).toBe(false);
    });
  });
});
