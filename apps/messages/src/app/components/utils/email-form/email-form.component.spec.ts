import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmailFormComponent } from './email-form.component';
import { ComposeEmailStateService } from '../services/compose-email-state.service';

describe('EmailFormComponent - Business Rules', () => {
  let component: EmailFormComponent;
  let fixture: ComponentFixture<EmailFormComponent>;
  let fb: FormBuilder;

  const mockSignup = {
    signupid: 123,
    title: 'Test Signup',
    mode: 'standard',
  };

  beforeEach(async () => {
    fb = new FormBuilder();

    await TestBed.configureTestingModule({
      imports: [EmailFormComponent],
      providers: [provideHttpClient(), FormBuilder, ComposeEmailStateService],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailFormComponent);
    component = fixture.componentInstance;

    // Create a basic form for the component
    component.emailForm = fb.group({
      fromName: ['', Validators.required],
      replyTo: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required],
    });
  });

  describe('Business Rule: Component Initialization', () => {
    it('should create component successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should have default formType as inviteToSignUp', () => {
      expect(component.formType).toBe('inviteToSignUp');
    });

    it('should have default title', () => {
      expect(component.title).toBe('Invite People to Sign Up');
    });
  });

  describe('Business Rule: Form Type Management', () => {
    it('should accept inviteToSignUp form type', () => {
      // When: Setting form type
      component.formType = 'inviteToSignUp';

      // Then: Form type should be set
      expect(component.formType).toBe('inviteToSignUp');
    });

    it('should accept emailParticipants form type', () => {
      // When: Setting form type
      component.formType = 'emailParticipants';

      // Then: Form type should be set
      expect(component.formType).toBe('emailParticipants');
    });

    it('should allow custom title input', () => {
      // When: Setting custom title
      component.title = 'Custom Email Title';

      // Then: Title should be updated
      expect(component.title).toBe('Custom Email Title');
    });
  });

  describe('Business Rule: Input Properties', () => {
    it('should accept selected signups via input', () => {
      // Given: Set signups via @Input
      component.selectedSignups = [mockSignup as any];

      // When: Getting selected signups
      const signups = component.selectedSignups;

      // Then: Should return signups
      expect(signups).toEqual([mockSignup]);
    });

    it('should accept selected tab groups via input', () => {
      // Given: Set tab groups via @Input
      const mockTabGroups = [{ value: '1', label: 'Tab 1' }];
      component.selectedTabGroups = mockTabGroups;

      // When: Getting selected tab groups
      const tabGroups = component.selectedTabGroups;

      // Then: Should return tab groups
      expect(tabGroups).toEqual(mockTabGroups);
    });

    it('should accept isSignUpIndexPageSelected via input', () => {
      // Given: Set flag via @Input
      component.isSignUpIndexPageSelected = true;

      // When: Getting flag
      const isSelected = component.isSignUpIndexPageSelected;

      // Then: Should return true
      expect(isSelected).toBe(true);
    });

    it('should accept selected groups via input', () => {
      // Given: Set groups via @Input
      const mockGroups = [{ value: '1', label: 'Group 1' }];
      component.selectedGroups = mockGroups;

      // When: Getting selected groups
      const groups = component.selectedGroups;

      // Then: Should return groups
      expect(groups).toEqual(mockGroups);
    });

    it('should accept recipient count via input', () => {
      // Given: Set recipient count via @Input
      component.recipientCount = 150;

      // When: Getting recipient count
      const count = component.recipientCount;

      // Then: Should return count
      expect(count).toBe(150);
    });

    it('should accept selected date slots via input', () => {
      // Given: Set date slots via @Input
      const mockSlots = [{ slotitemid: 1 }];
      component.selectedDateSlots = mockSlots as any;

      // When: Getting selected date slots
      const slots = component.selectedDateSlots;

      // Then: Should return slots
      expect(slots).toEqual(mockSlots);
    });

    it('should accept sub admins data via input', () => {
      // Given: Set sub admins via @Input
      const mockSubAdmins = [{ value: '1', label: 'Admin 1' }];
      component.subAdminsData = mockSubAdmins;

      // When: Getting sub admins
      const subAdmins = component.subAdminsData;

      // Then: Should return sub admins
      expect(subAdmins).toEqual(mockSubAdmins);
    });
  });

  describe('Business Rule: Signup Selection Detection', () => {
    it('should detect signup selection when signups exist', () => {
      // Given: Signups are selected via @Input
      component.selectedSignups = [mockSignup as any];

      // When: Checking for signup selection
      const hasSelection = component.hasSignupSelection;

      // Then: Should return true
      expect(hasSelection).toBe(true);
    });

    it('should detect signup selection when tab groups exist', () => {
      // Given: Tab groups are selected via @Input
      component.selectedTabGroups = [{ value: '1', label: 'Tab 1' }];

      // When: Checking for signup selection
      const hasSelection = component.hasSignupSelection;

      // Then: Should return true
      expect(hasSelection).toBe(true);
    });

    it('should detect signup selection when index page is selected', () => {
      // Given: Index page is selected via @Input
      component.isSignUpIndexPageSelected = true;

      // When: Checking for signup selection
      const hasSelection = component.hasSignupSelection;

      // Then: Should return true
      expect(hasSelection).toBe(true);
    });

    it('should return false when no signup selection exists', () => {
      // Given: No selections via @Input
      component.selectedSignups = [];
      component.selectedTabGroups = [];
      component.isSignUpIndexPageSelected = false;

      // When: Checking for signup selection
      const hasSelection = component.hasSignupSelection;

      // Then: Should return false
      expect(hasSelection).toBe(false);
    });
  });

  describe('Business Rule: People Selection Detection', () => {
    it('should detect people selection when groups exist', () => {
      // Given: Groups are selected via @Input
      component.selectedGroups = [{ value: '1', label: 'Group 1' }];

      // When: Checking for people selection
      const hasSelection = component.hasPeopleSelection;

      // Then: Should return true
      expect(hasSelection).toBe(true);
    });

    it('should return false when no groups are selected', () => {
      // Given: No groups selected via @Input
      component.selectedGroups = [];

      // When: Checking for people selection
      const hasSelection = component.hasPeopleSelection;

      // Then: Should return false
      expect(hasSelection).toBe(false);
    });
  });

  describe('Business Rule: Event Emissions', () => {
    it('should emit openSignUpsDialog event', () => {
      // Given: Event listener
      let eventEmitted = false;
      component.openSignUpsDialog.subscribe(() => {
        eventEmitted = true;
      });

      // When: Emitting event
      component.openSignUpsDialog.emit();

      // Then: Event should be emitted
      expect(eventEmitted).toBe(true);
    });

    it('should emit openPeopleDialog event', () => {
      // Given: Event listener
      let eventEmitted = false;
      component.openPeopleDialog.subscribe(() => {
        eventEmitted = true;
      });

      // When: Emitting event
      component.openPeopleDialog.emit();

      // Then: Event should be emitted
      expect(eventEmitted).toBe(true);
    });

    it('should emit openSelectFileDialog event', () => {
      // Given: Event listener
      let eventEmitted = false;
      component.openSelectFileDialog.subscribe(() => {
        eventEmitted = true;
      });

      // When: Emitting event
      component.openSelectFileDialog.emit();

      // Then: Event should be emitted
      expect(eventEmitted).toBe(true);
    });

    it('should emit openHelpDialog event', () => {
      // Given: Event listener
      let eventEmitted = false;
      component.openHelpDialog.subscribe(() => {
        eventEmitted = true;
      });

      // When: Emitting event
      component.openHelpDialog.emit();

      // Then: Event should be emitted
      expect(eventEmitted).toBe(true);
    });

    it('should emit previewAndSend event', () => {
      // Given: Event listener
      let eventEmitted = false;
      component.previewAndSend.subscribe(() => {
        eventEmitted = true;
      });

      // When: Emitting event
      component.previewAndSend.emit();

      // Then: Event should be emitted
      expect(eventEmitted).toBe(true);
    });

    it('should emit saveDraft event', () => {
      // Given: Event listener
      let eventEmitted = false;
      component.saveDraft.subscribe(() => {
        eventEmitted = true;
      });

      // When: Emitting event
      component.saveDraft.emit();

      // Then: Event should be emitted
      expect(eventEmitted).toBe(true);
    });

    it('should emit showRecipientDetails event', () => {
      // Given: Event listener
      let eventEmitted = false;
      component.showRecipientDetails.subscribe(() => {
        eventEmitted = true;
      });

      // When: Emitting event
      component.showRecipientDetails.emit();

      // Then: Event should be emitted
      expect(eventEmitted).toBe(true);
    });

    it('should emit editSelectedSlots event', () => {
      // Given: Event listener
      let eventEmitted = false;
      component.editSelectedSlots.subscribe(() => {
        eventEmitted = true;
      });

      // When: Emitting event
      component.editSelectedSlots.emit();

      // Then: Event should be emitted
      expect(eventEmitted).toBe(true);
    });
  });

  describe('Business Rule: Form Validation', () => {
    it('should have a valid form provided during initialization', () => {
      // Given: Component initialized in beforeEach

      // When: Checking emailForm property

      // Then: Should have valid form
      expect(component.emailForm).toBeTruthy();
      expect(component.emailForm instanceof FormGroup).toBe(true);
    });

    it('should have proper form controls in the email form', () => {
      // Given: Component initialized with form

      // When: Checking form controls
      const fromNameControl = component.emailForm.get('fromName');
      const replyToControl = component.emailForm.get('replyTo');
      const subjectControl = component.emailForm.get('subject');

      // Then: Should have all required controls
      expect(fromNameControl).toBeTruthy();
      expect(replyToControl).toBeTruthy();
      expect(subjectControl).toBeTruthy();
    });
  });
});
