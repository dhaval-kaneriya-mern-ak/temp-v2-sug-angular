import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { ComposeEmailComponentMain } from './compose-email';
import { ComposeService } from '../compose.service';
import { UserStateService } from '@services/user-state.service';
import { BehaviorSubject, of } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import {
  ISignUpItem,
  IGroupMember,
} from '@services/interfaces/messages-interface/compose.interface';
import { MemberProfile } from '@services/interfaces';

describe('ComposeEmailComponentMain - Business Rules', () => {
  let component: ComposeEmailComponentMain;
  let fixture: ComponentFixture<ComposeEmailComponentMain>;
  let memberProfileSubject: BehaviorSubject<MemberProfile | null>;

  const mockSignup = {
    signupid: 123,
    title: 'Test Signup',
    fulltitle: 'Test Signup Full',
    mode: 'standard',
  } as ISignUpItem;

  const mockRsvpSignup = {
    signupid: 456,
    mode: 'rsvp',
    title: 'RSVP Signup',
  } as ISignUpItem;

  const mockMemberProfile = {
    id: 1,
    firstname: 'John',
    lastname: 'Doe',
    email: 'john.doe@example.com',
  } as MemberProfile;

  const mockGroupMember = {
    id: 1,
    communitymemberid: 100,
    firstname: 'Jane',
    lastname: 'Smith',
    email: 'jane@example.com',
    isgroupemail: false,
  } as IGroupMember;

  beforeEach(async () => {
    memberProfileSubject = new BehaviorSubject<MemberProfile | null>(
      mockMemberProfile
    );

    const mockComposeService = {
      getSignUpList: () =>
        of({
          success: true,
          message: [],
          data: [mockSignup],
          pagination: {
            totalRecords: 1,
            totalPages: 1,
            currentPage: 1,
            pageSize: 10,
          },
          links: { self: '', previous: '', next: '' },
        }),
      getSubAdmins: () =>
        of({
          success: true,
          message: [],
          data: [],
        }),
      getGroupforMembers: () =>
        of({
          success: true,
          message: [],
          data: [],
          links: { self: '', previous: '', next: '' },
        }),
      getTabGroups: () =>
        of({
          success: true,
          message: [],
          data: [],
        }),
      getGroupMembers: () =>
        of({
          success: true,
          message: [],
          data: { members: [mockGroupMember] },
        }),
      getDateSlots: () =>
        of({
          success: true,
          message: [],
          data: [],
        }),
    };

    const mockUserStateService = {
      memberProfile$: memberProfileSubject.asObservable(),
      userProfile$: of(null),
      isValidEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    };

    await TestBed.configureTestingModule({
      imports: [ComposeEmailComponentMain],
      providers: [
        provideHttpClient(),
        provideToastr(),
        FormBuilder,
        { provide: ComposeService, useValue: mockComposeService },
        { provide: UserStateService, useValue: mockUserStateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ComposeEmailComponentMain);
    component = fixture.componentInstance;
  });

  describe('Business Rule: Component Initialization', () => {
    it('should create component successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with recipient count of 0', () => {
      expect(component.recipientCount).toBe(0);
    });

    it('should initialize with empty selected signups array', () => {
      expect(component.selectedSignups).toEqual([]);
    });

    it('should initialize with empty selected groups array', () => {
      expect(component.selectedGroups).toEqual([]);
    });

    it('should initialize all dialog visibility flags to false', () => {
      expect(component.signUpModelShow).toBe(false);
      expect(component.isPeopleDialogVisible).toBe(false);
      expect(component.isSelectFileDialogVisible).toBe(false);
      expect(component.isHelpDialogVisible).toBe(false);
      expect(component.isPreViewEmailDialogVisible).toBe(false);
      expect(component.isRecipientDialogVisible).toBe(false);
    });
  });

  describe('Business Rule: Form Initialization on Component Init', () => {
    it('should initialize emailFormOne with required form controls', () => {
      // When: Component initializes
      fixture.detectChanges();

      // Then: Form should have all required controls
      expect(component.emailFormOne).toBeDefined();
      expect(component.emailFormOne.get('fromName')).toBeDefined();
      expect(component.emailFormOne.get('replyTo')).toBeDefined();
      expect(component.emailFormOne.get('subject')).toBeDefined();
      expect(component.emailFormOne.get('message')).toBeDefined();
    });

    it('should initialize emailFormTwo with required form controls', () => {
      // When: Component initializes
      fixture.detectChanges();

      // Then: Form should have all required controls
      expect(component.emailFormTwo).toBeDefined();
      expect(component.emailFormTwo.get('fromName')).toBeDefined();
      expect(component.emailFormTwo.get('replyTo')).toBeDefined();
      expect(component.emailFormTwo.get('subject')).toBeDefined();
      expect(component.emailFormTwo.get('message')).toBeDefined();
    });

    it('should initialize signUpDialogForm with selectedSignupValue control', () => {
      // When: Component initializes
      fixture.detectChanges();

      // Then: Dialog form should be initialized
      expect(component.signUpDialogForm).toBeDefined();
      expect(
        component.signUpDialogForm.get('selectedSignupValue')
      ).toBeDefined();
    });
  });

  describe('Business Rule: Dialog Radio Options Based on Context', () => {
    it('should show tab groups option when tab groups data exists', () => {
      // Given: Tab groups data available
      component.tabGroupsData = [{ value: '1', label: 'Tab Group 1' }];

      // When: Getting dialog radio options
      const options = component.dialogRadioOptions;

      // Then: Should include tab groups option
      expect(options.length).toBe(3);
      expect(options.some((opt) => opt.value === 'LinkSpecifixTabGroup')).toBe(
        true
      );
    });

    it('should not show tab groups option when no tab groups data', () => {
      // Given: No tab groups data
      component.tabGroupsData = [];

      // When: Getting dialog radio options
      const options = component.dialogRadioOptions;

      // Then: Should only have 2 base options
      expect(options.length).toBe(2);
      expect(options.some((opt) => opt.value === 'LinkSpecifixTabGroup')).toBe(
        false
      );
    });

    it('should always include "Link to specific sign up(s)" option', () => {
      // When: Getting dialog radio options
      const options = component.dialogRadioOptions;

      // Then: Should include specific signup option
      expect(options.some((opt) => opt.value === 'LinkSpecificSignup')).toBe(
        true
      );
    });

    it('should always include "Link to my main account" option', () => {
      // When: Getting dialog radio options
      const options = component.dialogRadioOptions;

      // Then: Should include main account option
      expect(options.some((opt) => opt.value === 'LinkMainAccount')).toBe(true);
    });
  });

  describe('Business Rule: Send Message Radio Options Based on Signup Type', () => {
    it('should show RSVP-specific options when RSVP signup is selected', () => {
      // Given: RSVP signup selected
      component.selectedSignups = [mockRsvpSignup];

      // When: Getting send message radio options
      const options = component.sendMessagePeopleRadioOptions;

      // Then: Should include RSVP response option
      expect(options.some((opt) => opt.value === 'specificRsvpResponse')).toBe(
        true
      );
      expect(options.length).toBe(3);
    });

    it('should not show RSVP options for non-RSVP signups', () => {
      // Given: Component initialized and standard signup selected
      fixture.detectChanges();
      component.selectedSignups = [mockSignup];

      // When: Getting send message radio options
      const options = component.sendMessagePeopleRadioOptions;

      // Then: Should not include RSVP response option
      expect(options.some((opt) => opt.value === 'specificRsvpResponse')).toBe(
        false
      );
    });

    it('should show limited options when main account is selected', () => {
      // Given: Component initialized and main account selected
      fixture.detectChanges();
      component.selectedSignups = [];
      component.signUpDialogForm.patchValue({
        selectedSignupValue: 'LinkMainAccount',
      });

      // When: Getting send message radio options
      const options = component.sendMessagePeopleRadioOptions;

      // Then: Should only show group and select options
      expect(options.length).toBe(2);
      expect(
        options.some((opt) => opt.value === 'sendMessagePeopleRadio')
      ).toBe(true);
      expect(
        options.some((opt) => opt.value === 'sendMessagePeopleIselect')
      ).toBe(true);
    });

    it('should detect RSVP signup regardless of mode case', () => {
      // Given: RSVP signup with uppercase mode
      const upperCaseRsvp = { ...mockRsvpSignup, mode: 'RSVP' };
      component.selectedSignups = [upperCaseRsvp];

      // When: Getting send message radio options
      const options = component.sendMessagePeopleRadioOptions;

      // Then: Should detect RSVP
      expect(options.some((opt) => opt.value === 'specificRsvpResponse')).toBe(
        true
      );
    });

    it('should show RSVP options when at least one RSVP signup in mixed selection', () => {
      // Given: Mix of RSVP and standard signups
      component.selectedSignups = [mockSignup, mockRsvpSignup];

      // When: Getting send message radio options
      const options = component.sendMessagePeopleRadioOptions;

      // Then: Should show RSVP options
      expect(options.some((opt) => opt.value === 'specificRsvpResponse')).toBe(
        true
      );
    });
  });

  describe('Business Rule: Signup Selection Management', () => {
    it('should add signup to selectedSignups array', () => {
      // When: Adding a signup
      component.selectedSignups = [mockSignup];

      // Then: Signup should be in array
      expect(component.selectedSignups.length).toBe(1);
      expect(component.selectedSignups[0].signupid).toBe(123);
    });

    it('should allow multiple signup selections', () => {
      // When: Adding multiple signups
      const signup2 = { ...mockSignup, signupid: 456, title: 'Signup 2' };
      component.selectedSignups = [mockSignup, signup2];

      // Then: Both signups should be in array
      expect(component.selectedSignups.length).toBe(2);
    });

    it('should clear selected signups when reset', () => {
      // Given: Signups selected
      component.selectedSignups = [mockSignup];

      // When: Clearing signups
      component.selectedSignups = [];

      // Then: Array should be empty
      expect(component.selectedSignups.length).toBe(0);
    });
  });

  describe('Business Rule: Recipient Count Management', () => {
    it('should update recipient count when set', () => {
      // When: Setting recipient count
      component.recipientCount = 150;

      // Then: Count should be updated
      expect(component.recipientCount).toBe(150);
    });

    it('should handle recipient count of 0', () => {
      // Given: Non-zero count
      component.recipientCount = 100;

      // When: Resetting to 0
      component.recipientCount = 0;

      // Then: Count should be 0
      expect(component.recipientCount).toBe(0);
    });

    it('should handle large recipient counts', () => {
      // When: Setting large count
      component.recipientCount = 10000;

      // Then: Should accept large numbers
      expect(component.recipientCount).toBe(10000);
    });
  });

  describe('Business Rule: Group Selection Management', () => {
    it('should store selected groups with their data', () => {
      // When: Selecting groups
      const groups = [
        { value: '1', label: 'Group 1' },
        { value: '2', label: 'Group 2' },
      ];
      component.selectedGroups = groups;

      // Then: Groups should be stored
      expect(component.selectedGroups.length).toBe(2);
      expect(component.selectedGroups[0].label).toBe('Group 1');
    });

    it('should allow clearing selected groups', () => {
      // Given: Groups selected
      component.selectedGroups = [{ value: '1', label: 'Group 1' }];

      // When: Clearing groups
      component.selectedGroups = [];

      // Then: Array should be empty
      expect(component.selectedGroups.length).toBe(0);
    });
  });

  describe('Business Rule: Dialog Visibility Management', () => {
    it('should toggle signup dialog visibility', () => {
      // When: Opening dialog
      component.signUpModelShow = true;

      // Then: Dialog should be visible
      expect(component.signUpModelShow).toBe(true);

      // When: Closing dialog
      component.signUpModelShow = false;

      // Then: Dialog should be hidden
      expect(component.signUpModelShow).toBe(false);
    });

    it('should toggle people dialog visibility', () => {
      // When: Opening dialog
      component.isPeopleDialogVisible = true;

      // Then: Dialog should be visible
      expect(component.isPeopleDialogVisible).toBe(true);
    });

    it('should toggle help dialog visibility', () => {
      // When: Opening dialog
      component.isHelpDialogVisible = true;

      // Then: Dialog should be visible
      expect(component.isHelpDialogVisible).toBe(true);
    });

    it('should toggle preview email dialog visibility', () => {
      // When: Opening dialog
      component.isPreViewEmailDialogVisible = true;

      // Then: Dialog should be visible
      expect(component.isPreViewEmailDialogVisible).toBe(true);
    });

    it('should toggle recipient details dialog visibility', () => {
      // When: Opening dialog
      component.isRecipientDialogVisible = true;

      // Then: Dialog should be visible
      expect(component.isRecipientDialogVisible).toBe(true);
    });

    it('should manage multiple dialogs independently', () => {
      // When: Opening multiple dialogs
      component.signUpModelShow = true;
      component.isPeopleDialogVisible = true;

      // Then: Both dialogs should be visible
      expect(component.signUpModelShow).toBe(true);
      expect(component.isPeopleDialogVisible).toBe(true);
    });
  });

  describe('Business Rule: Loading State Management', () => {
    it('should initialize with loading false', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should set loading state during operations', () => {
      // When: Starting operation
      component.isLoading = true;

      // Then: Loading should be true
      expect(component.isLoading).toBe(true);

      // When: Completing operation
      component.isLoading = false;

      // Then: Loading should be false
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Business Rule: Dialog Configuration', () => {
    it('should configure signup dialog as modal', () => {
      expect(component.signUpDialogConfig.modal).toBe(true);
    });

    it('should configure people dialog as closable', () => {
      expect(component.peopleDialogConf.closable).toBe(true);
    });

    it('should configure help dialog with correct width', () => {
      expect(component.helpDialogConf.width).toBe('850px');
    });

    it('should configure preview email dialog as dismissable on mask click', () => {
      expect(component.preViewEmailDialogConfig.dismissableMask).toBe(true);
    });

    it('should configure all dialogs with center position', () => {
      expect(component.signUpDialogConfig.position).toBe('center');
      expect(component.peopleDialogConf.position).toBe('center');
      expect(component.helpDialogConf.position).toBe('center');
      expect(component.preViewEmailDialogConfig.position).toBe('center');
    });
  });

  describe('Business Rule: Memory Management', () => {
    it('should implement OnDestroy lifecycle hook', () => {
      // Then: Component should have ngOnDestroy method
      expect(component.ngOnDestroy).toBeDefined();
    });

    it('should cleanup subscriptions on destroy', () => {
      // Given: Component initialized
      fixture.detectChanges();

      // When: Component is destroyed
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
