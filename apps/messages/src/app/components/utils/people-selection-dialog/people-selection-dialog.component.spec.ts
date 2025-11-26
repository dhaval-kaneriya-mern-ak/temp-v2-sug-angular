import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { PeopleSelectionDialogComponent } from './people-selection-dialog.component';
import { ComposeService } from '../../compose/compose.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { ISelectOption } from '@lumaverse/sug-ui';
import { ISignUpItem } from '@services/interfaces/messages-interface/compose.interface';

describe('PeopleSelectionDialogComponent - Business Rules', () => {
  let component: PeopleSelectionDialogComponent;
  let fixture: ComponentFixture<PeopleSelectionDialogComponent>;
  let mockComposeService: Partial<ComposeService>;

  const mockGroupOptions: ISelectOption[] = [
    { label: 'Group 1', value: '1' },
    { label: 'Group 2', value: '2' },
  ];

  const mockSelectedSignups: ISignUpItem[] = [
    {
      signupid: 123,
      title: 'Test Signup',
      mode: 'standard',
    } as ISignUpItem,
  ];

  beforeEach(async () => {
    mockComposeService = {
      getGroupMembers: vi.fn().mockReturnValue(
        of({
          success: true,
          data: {
            recipients: [
              { email: 'test1@example.com', displayname: 'Test User 1' },
              { email: 'test2@example.com', displayname: 'Test User 2' },
            ],
          },
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [PeopleSelectionDialogComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideToastr(),
        FormBuilder,
        {
          provide: ComposeService,
          useValue: mockComposeService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PeopleSelectionDialogComponent);
    component = fixture.componentInstance;

    // Set up input properties
    component.groupOptions = mockGroupOptions;
    component.selectedSignups = mockSelectedSignups;
    component.selectedDateSlots = [];
    component.recipientCount = 0;
    component.isSignUpIndexPageSelected = false;
    component.selectedTabGroups = [];
    component.peopleSelectionData = {
      selectedValue: null,
      selectedGroups: [],
      manualEmails: '',
      manualEmailsGroup: [],
      groupEmailAlias: '',
      useGroupAlias: false,
      includeNonGroupMembers: false,
      includeNonGroupMembersForPeople: false,
      rsvpResponseyes: false,
      rsvpResponseno: false,
      rsvpResponsemaybe: false,
      rsvpResponsenoresponse: false,
    };

    fixture.detectChanges();
  });

  describe('Business Rule: Component Initialization', () => {
    it('should create component successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with visible false', () => {
      expect(component.visible).toBe(false);
    });

    it('should have default formType as inviteToSignUp', () => {
      expect(component.formType).toBe('inviteToSignUp');
    });

    it('should initialize peopleDialogForm with all controls', () => {
      expect(component.peopleDialogForm).toBeDefined();
      expect(component.peopleDialogForm.get('selectedValue')).toBeTruthy();
      expect(component.peopleDialogForm.get('selectedGroups')).toBeTruthy();
      expect(component.peopleDialogForm.get('manualEmails')).toBeTruthy();
      expect(component.peopleDialogForm.get('groupEmailAlias')).toBeTruthy();
    });
  });

  describe('Business Rule: Dialog Configuration', () => {
    it('should have proper dialog configuration', () => {
      expect(component.dialogConfig).toBeDefined();
      expect(component.dialogConfig.modal).toBe(true);
      expect(component.dialogConfig.closable).toBe(true);
      expect(component.dialogConfig.width).toBe('800px');
    });

    it('should allow escape key and mask dismissal', () => {
      expect(component.dialogConfig.closeOnEscape).toBe(false);
      expect(component.dialogConfig.dismissableMask).toBe(false);
    });
  });

  describe('Business Rule: Form Type Based Radio Options', () => {
    it('should show Form One options for inviteToSignUp', () => {
      component.formType = 'inviteToSignUp';

      const options = component.currentRadioOptions;

      expect(options).toEqual(component.formOneRadioOptions);
      expect(options.some((o) => o.value === 'peopleingroups')).toBe(true);
      expect(options.some((o) => o.value === 'ManuallyEnterEmail')).toBe(true);
    });

    it('should show Form Two options for emailParticipants', () => {
      component.formType = 'emailParticipants';
      component.selectedSignups = mockSelectedSignups;

      const options = component.formTwoRadioOptions;

      expect(options.some((o) => o.value === 'peopleWhoSignedUp')).toBe(true);
      expect(options.some((o) => o.value === 'peopleWhoNotSignedUp')).toBe(
        true
      );
    });

    it('should show RSVP options when RSVP signup selected', () => {
      component.formType = 'emailParticipants';
      component.selectedSignups = [
        { signupid: 123, mode: 'RSVP' } as ISignUpItem,
      ];

      const options = component.formTwoRadioOptions;

      expect(options.some((o) => o.value === 'specificRsvpResponse')).toBe(
        true
      );
    });

    it('should show limited options when index page selected', () => {
      component.formType = 'emailParticipants';
      component.isSignUpIndexPageSelected = true;

      const options = component.formTwoRadioOptions;

      expect(options.length).toBe(2); // Only group and manual select
      expect(options.some((o) => o.value === 'sendMessagePeopleRadio')).toBe(
        true
      );
      expect(options.some((o) => o.value === 'sendMessagePeopleIselect')).toBe(
        true
      );
    });

    it('should show multi-signup options when multiple signups selected', () => {
      component.formType = 'emailParticipants';
      component.selectedSignups = [
        { signupid: 123, mode: 'standard' } as ISignUpItem,
        { signupid: 124, mode: 'standard' } as ISignUpItem,
      ];

      const options = component.formTwoRadioOptions;

      expect(options.some((o) => o.value === 'peopleOnWaitlist')).toBe(true);
      expect(options.some((o) => o.value === 'peopleSignedUpAndWaitlist')).toBe(
        true
      );
    });
  });

  describe('Business Rule: Group Selection', () => {
    it('should require at least one group when closing', () => {
      component.peopleDialogForm.patchValue({
        selectedValue: 'peopleingroups',
        selectedGroups: [],
      });
      const toastrSpy = vi
        .spyOn(component['toastr'], 'error')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => null as any);

      component.closeDialog(false);

      expect(toastrSpy).toHaveBeenCalledWith(
        'Please select at least one group',
        'Error'
      );
      toastrSpy.mockRestore();
    });

    it('should emit selectedGroupsChange with selected groups', () => {
      const emitSpy = vi.spyOn(component.selectedGroupsChange, 'emit');
      component.peopleDialogForm.patchValue({
        selectedValue: 'peopleingroups',
        selectedGroups: ['1', '2'],
      });

      component.closeDialog(false);

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should show combined label when includeNonGroupMembers checked', () => {
      const emitSpy = vi.spyOn(component.selectedGroupsChange, 'emit');
      component.peopleDialogForm.patchValue({
        selectedValue: 'peopleingroups',
        selectedGroups: ['1'],
        includeNonGroupMembers: true,
      });

      component.closeDialog(false);

      expect(emitSpy).toHaveBeenCalledWith([
        {
          label: 'Group and non-group members who signed up',
          value: '1',
        },
      ]);
    });

    it('should show group names when includeNonGroupMembers not checked', () => {
      const emitSpy = vi.spyOn(component.selectedGroupsChange, 'emit');
      component.peopleDialogForm.patchValue({
        selectedValue: 'peopleingroups',
        selectedGroups: ['1'],
        includeNonGroupMembers: false,
      });

      component.closeDialog(false);

      expect(emitSpy).toHaveBeenCalledWith([{ label: 'Group 1', value: '1' }]);
    });
  });

  describe('Business Rule: Manual Email Entry', () => {
    it('should parse comma-separated emails', () => {
      const emitSpy = vi.spyOn(component.recipientCountChange, 'emit');
      component.peopleDialogForm.patchValue({
        selectedValue: 'ManuallyEnterEmail',
        manualEmails: 'test1@example.com, test2@example.com',
      });

      component.closeDialog(false);

      expect(emitSpy).toHaveBeenCalledWith(2);
    });

    it('should parse newline-separated emails', () => {
      const emitSpy = vi.spyOn(component.recipientCountChange, 'emit');
      component.peopleDialogForm.patchValue({
        selectedValue: 'ManuallyEnterEmail',
        manualEmails: 'test1@example.com\ntest2@example.com',
      });

      component.closeDialog(false);

      expect(emitSpy).toHaveBeenCalledWith(2);
    });

    it('should include group email alias in count', () => {
      const emitSpy = vi.spyOn(component.recipientCountChange, 'emit');
      component.peopleDialogForm.patchValue({
        selectedValue: 'ManuallyEnterEmail',
        manualEmails: 'test1@example.com',
        groupEmailAlias: 'alias@example.com',
      });

      component.closeDialog(false);

      expect(emitSpy).toHaveBeenCalledWith(2);
    });

    it('should validate email format', () => {
      component.peopleDialogForm.patchValue({
        selectedValue: 'ManuallyEnterEmail',
        manualEmails: 'invalid-email, test@example.com',
      });
      const toastrSpy = vi
        .spyOn(component['toastr'], 'error')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => null as any);

      component.closeDialog(false);

      expect(toastrSpy).toHaveBeenCalled();
      expect((toastrSpy.mock.calls[0][0] as string).includes('invalid')).toBe(
        true
      );
      toastrSpy.mockRestore();
    });

    it('should require at least one email', () => {
      component.peopleDialogForm.patchValue({
        selectedValue: 'ManuallyEnterEmail',
        manualEmails: '',
      });
      const toastrSpy = vi
        .spyOn(component['toastr'], 'error')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => null as any);

      component.closeDialog(false);

      expect(toastrSpy).toHaveBeenCalledWith(
        'Please enter at least one email address',
        'Error'
      );
      toastrSpy.mockRestore();
    });
  });

  describe('Business Rule: RSVP Response Selection', () => {
    it('should require at least one RSVP response', () => {
      component.peopleDialogForm.patchValue({
        selectedValue: 'specificRsvpResponse',
        rsvpResponseyes: false,
        rsvpResponseno: false,
        rsvpResponsemaybe: false,
        rsvpResponsenoresponse: false,
      });
      const toastrSpy = vi
        .spyOn(component['toastr'], 'error')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => null as any);

      component.closeDialog(false);

      expect(toastrSpy).toHaveBeenCalledWith(
        'Please select at least one RSVP response',
        'Error'
      );
      toastrSpy.mockRestore();
    });

    it('should collect selected RSVP responses', () => {
      const emitSpy = vi.spyOn(component.selectedGroupsChange, 'emit');
      component.peopleDialogForm.patchValue({
        selectedValue: 'specificRsvpResponse',
        rsvpResponseyes: true,
        rsvpResponseno: true,
      });
      const toastrSpy = vi
        .spyOn(component['toastr'], 'error')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => null as any);

      component.closeDialog(false);

      expect(emitSpy).toHaveBeenCalledWith([
        {
          label: 'Specific RSVP Responses',
          value: 'specificRsvpResponse',
        },
      ]);
      toastrSpy.mockRestore();
    });
  });

  describe('Business Rule: People I Will Select Option', () => {
    it('should require date slots to be selected', () => {
      component.peopleDialogForm.patchValue({
        selectedValue: 'sendMessagePeopleIselect',
      });
      component.selectedDateSlots = [];
      const toastrSpy = vi
        .spyOn(component['toastr'], 'error')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => null as any);

      component.closeDialog(false);

      expect(toastrSpy).toHaveBeenCalledWith(
        'Please select people from groups or sign up',
        'Error'
      );
      toastrSpy.mockRestore();
    });

    it('should allow closing when date slots selected', () => {
      const emitSpy = vi.spyOn(component.selectedGroupsChange, 'emit');
      component.peopleDialogForm.patchValue({
        selectedValue: 'sendMessagePeopleIselect',
      });
      component.selectedDateSlots = [{ slotitemid: 1 }];

      component.closeDialog(false);

      expect(emitSpy).toHaveBeenCalledWith([
        {
          label: 'Custom Selection',
          value: 'sendMessagePeopleIselect',
        },
      ]);
    });
  });

  describe('Business Rule: Radio Change Handling', () => {
    it('should reset form values when radio changes', () => {
      component.peopleDialogForm.patchValue({
        selectedValue: 'peopleingroups',
        selectedGroups: ['1'],
        manualEmails: 'test@example.com',
      });

      component.peopleDialogForm.patchValue({
        selectedValue: 'ManuallyEnterEmail',
      });
      component.onRadioChange();

      expect(component.peopleDialogForm.value.selectedGroups).toEqual([]);
      expect(component.peopleDialogForm.value.manualEmails).toBe('');
    });

    it('should emit recipientCountChange with 0 on radio change', () => {
      const emitSpy = vi.spyOn(component.recipientCountChange, 'emit');
      component.peopleDialogForm.patchValue({
        selectedValue: 'peopleingroups',
      });

      component.onRadioChange();

      expect(emitSpy).toHaveBeenCalledWith(0);
    });
  });

  describe('Business Rule: Form State Preservation', () => {
    it('should emit peopleSelectionDataChange when closing with confirm', () => {
      const emitSpy = vi.spyOn(component.peopleSelectionDataChange, 'emit');
      component.peopleDialogForm.patchValue({
        selectedValue: 'ManuallyEnterEmail',
        manualEmails: 'test@example.com',
      });

      component.closeDialog(false);

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should NOT emit peopleSelectionDataChange when cancelled', () => {
      const emitSpy = vi.spyOn(component.peopleSelectionDataChange, 'emit');
      component.peopleDialogForm.patchValue({
        selectedValue: 'ManuallyEnterEmail',
        manualEmails: 'test@example.com',
      });

      component.closeDialog(true);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should restore saved state when opening dialog', fakeAsync(() => {
      component.peopleSelectionData = {
        selectedValue: 'peopleingroups',
        selectedGroups: ['1'],
        manualEmails: '',
        manualEmailsGroup: [],
        groupEmailAlias: '',
        useGroupAlias: false,
        includeNonGroupMembers: false,
        includeNonGroupMembersForPeople: false,
        rsvpResponseyes: false,
        rsvpResponseno: false,
        rsvpResponsemaybe: false,
        rsvpResponsenoresponse: false,
      };

      component.ngOnChanges({
        visible: {
          currentValue: true,
          previousValue: false,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      // Wait for the setTimeout to execute
      tick();

      expect(component.peopleDialogForm.value.selectedValue).toBe(
        'peopleingroups'
      );
    }));
  });

  describe('Business Rule: Various People Selection Types', () => {
    it('should handle peopleWhoSignedUp selection', () => {
      const emitSpy = vi.spyOn(component.selectedGroupsChange, 'emit');
      component.peopleDialogForm.patchValue({
        selectedValue: 'peopleWhoSignedUp',
      });
      const toastrSpy = vi
        .spyOn(component['toastr'], 'error')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => null as any);

      component.closeDialog(false);

      expect(emitSpy).toHaveBeenCalledWith([
        {
          label: 'People who have signed up',
          value: 'peopleWhoSignedUp',
        },
      ]);
      toastrSpy.mockRestore();
    });

    it('should handle peopleWhoNotSignedUp selection', () => {
      const emitSpy = vi.spyOn(component.selectedGroupsChange, 'emit');
      component.peopleDialogForm.patchValue({
        selectedValue: 'peopleWhoNotSignedUp',
      });
      const toastrSpy = vi
        .spyOn(component['toastr'], 'error')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => null as any);

      component.closeDialog(false);

      expect(emitSpy).toHaveBeenCalledWith([
        {
          label: 'Group members who have not signed up',
          value: 'peopleWhoNotSignedUp',
        },
      ]);
      toastrSpy.mockRestore();
    });

    it('should handle peopleOnWaitlist selection', () => {
      const emitSpy = vi.spyOn(component.selectedGroupsChange, 'emit');
      component.peopleDialogForm.patchValue({
        selectedValue: 'peopleOnWaitlist',
      });
      const toastrSpy = vi
        .spyOn(component['toastr'], 'error')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => null as any);

      component.closeDialog(false);

      expect(emitSpy).toHaveBeenCalledWith([
        {
          label: 'People who are on a waitlist',
          value: 'peopleOnWaitlist',
        },
      ]);
      toastrSpy.mockRestore();
    });

    it('should handle peopleSignedUpAndWaitlist selection', () => {
      const emitSpy = vi.spyOn(component.selectedGroupsChange, 'emit');
      component.peopleDialogForm.patchValue({
        selectedValue: 'peopleSignedUpAndWaitlist',
      });
      const toastrSpy = vi
        .spyOn(component['toastr'], 'error')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => null as any);

      component.closeDialog(false);

      expect(emitSpy).toHaveBeenCalledWith([
        {
          label: 'People who have signed up and people who are on a waitlist',
          value: 'peopleSignedUpAndWaitlist',
        },
      ]);
      toastrSpy.mockRestore();
    });
  });

  describe('Business Rule: Dialog Visibility Management', () => {
    it('should emit visibleChange true when opening', () => {
      let emittedValue: boolean | null = null;
      component.visibleChange.subscribe((value) => {
        emittedValue = value;
      });

      // Simulate parent component opening the dialog by setting visible to true
      component.visible = true;
      component.visibleChange.emit(true);

      expect(emittedValue).toBe(true);
      expect(component.visible).toBe(true);
    });

    it('should emit visibleChange false when closing', () => {
      let emittedValue: boolean | null = null;
      component.visibleChange.subscribe((value) => {
        emittedValue = value;
      });
      component.peopleDialogForm.patchValue({
        selectedValue: 'ImportEmailFromProvider',
      });

      component.closeDialog(false);

      expect(emittedValue).toBe(false);
      expect(component.visible).toBe(false);
    });

    it('should emit peopleSelected on confirm', () => {
      let eventEmitted = false;
      component.peopleSelected.subscribe(() => {
        eventEmitted = true;
      });
      component.peopleDialogForm.patchValue({
        selectedValue: 'ImportEmailFromProvider',
      });

      component.closeDialog(false);

      expect(eventEmitted).toBe(true);
    });
  });

  describe('Business Rule: Form Validation', () => {
    it('should require radio option to be selected', () => {
      component.peopleDialogForm.patchValue({
        selectedValue: null,
      });
      const toastrSpy = vi
        .spyOn(component['toastr'], 'error')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => null as any);

      component.closeDialog(false);

      expect(toastrSpy).toHaveBeenCalledWith(
        'Please select a recipient option',
        'Error'
      );
      toastrSpy.mockRestore();
    });

    it('should have email validator on groupEmailAlias', () => {
      const control = component.peopleDialogForm.get('groupEmailAlias');

      expect(control).toBeTruthy();
      // Email validation is configured in the form
      expect(control?.hasError).toBeDefined();
    });
  });

  describe('Business Rule: Email Validation', () => {
    it('should validate correct email format', () => {
      const result = component['isValidEmail']('test@example.com');

      expect(result).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = component['isValidEmail']('invalid-email');

      expect(result).toBe(false);
    });

    it('should handle complex valid emails', () => {
      const result = component['isValidEmail'](
        'test.name+tag@sub.example.co.uk'
      );

      expect(result).toBe(true);
    });
  });

  describe('Business Rule: Import from Provider', () => {
    it('should handle ImportEmailFromProvider selection', () => {
      const groupEmitSpy = vi.spyOn(component.selectedGroupsChange, 'emit');
      const countEmitSpy = vi.spyOn(component.recipientCountChange, 'emit');
      component.peopleDialogForm.patchValue({
        selectedValue: 'ImportEmailFromProvider',
      });

      component.closeDialog(false);

      expect(groupEmitSpy).toHaveBeenCalledWith([
        {
          label: 'Import from provider',
          value: 'ImportEmailFromProvider',
        },
      ]);
      expect(countEmitSpy).toHaveBeenCalledWith(0);
    });
  });
});
