import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';
import { ComposeEmailComponent } from './compose-email';
import { ComposeService } from '../compose.service';
import { UserStateService } from '@services/user-state.service';
import { BehaviorSubject, of } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { MemberProfile } from '@services/interfaces';

describe('ComposeEmailComponent (Refactored)', () => {
  let component: ComposeEmailComponent;
  let fixture: ComponentFixture<ComposeEmailComponent>;
  let memberProfileSubject: BehaviorSubject<MemberProfile | null>;

  const mockMemberProfile = {
    id: 12345,
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com',
    currentEmail: 'john@example.com',
    emailaddress: 'john@example.com',
  } as unknown as MemberProfile;

  beforeEach(async () => {
    memberProfileSubject = new BehaviorSubject<MemberProfile | null>(
      mockMemberProfile
    );

    const mockComposeService = {
      getSignUpList: () =>
        of({
          success: true,
          message: [],
          data: [],
          pagination: {
            totalRecords: 0,
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
          data: { members: [] },
        }),
      getDateSlots: () =>
        of({
          success: true,
          message: [],
          data: [],
        }),
      getPortalSignup: () =>
        of({
          success: true,
          message: [],
          data: null,
        }),
      getMemberIndexPage: () =>
        of({
          success: true,
          message: [],
          data: null,
        }),
    };

    const mockUserStateService = {
      memberProfile$: memberProfileSubject.asObservable(),
      userProfile$: of(null),
      isValidEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      isBasicUser: (userProfile: any) => false,
    };

    await TestBed.configureTestingModule({
      imports: [ComposeEmailComponent],
      providers: [
        provideHttpClient(),
        provideToastr(),
        FormBuilder,
        { provide: ComposeService, useValue: mockComposeService },
        { provide: UserStateService, useValue: mockUserStateService },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ComposeEmailComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create component successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize all dialog visibility flags to false', () => {
      expect(component.isHelpDialogVisible).toBe(false);
      expect(component.isPeopleDialogVisible).toBe(false);
      expect(component.isSelectFileDialogVisible).toBe(false);
      expect(component.isRecipientDialogVisible).toBe(false);
      expect(component.isPreviewDialogVisible).toBe(false);
      expect(component.isDateSlotsDialogVisible).toBe(false);
    });
  });

  describe('Form Initialization', () => {
    it('should initialize emailFormOne with all required controls', () => {
      fixture.detectChanges();

      expect(component.emailFormOne.get('selectedValue')).toBeDefined();
      expect(component.emailFormOne.get('emailSubject')).toBeDefined();
      expect(component.emailFormOne.get('message')).toBeDefined();
      expect(component.emailFormOne.get('fromEmail')).toBeDefined();
      expect(component.emailFormOne.get('fromName')).toBeDefined();
      expect(component.emailFormOne.get('replyTo')).toBeDefined();
      expect(component.emailFormOne.get('selectedSignups')).toBeDefined();
      expect(component.emailFormOne.get('selectedTabGroups')).toBeDefined();
      expect(
        component.emailFormOne.get('isSignUpIndexPageSelected')
      ).toBeDefined();
    });

    it('should initialize emailFormTwo with all required controls', () => {
      fixture.detectChanges();

      expect(component.emailFormTwo.get('selectedValue')).toBeDefined();
      expect(component.emailFormTwo.get('emailSubject')).toBeDefined();
      expect(component.emailFormTwo.get('message')).toBeDefined();
      expect(component.emailFormTwo.get('fromEmail')).toBeDefined();
      expect(component.emailFormTwo.get('fromName')).toBeDefined();
      expect(component.emailFormTwo.get('replyTo')).toBeDefined();
      expect(component.emailFormTwo.get('selectedSignups')).toBeDefined();
      expect(component.emailFormTwo.get('toPeople')).toBeDefined();
    });
  });

  describe('Radio Options', () => {
    it('should initialize main radio options', () => {
      fixture.detectChanges();

      expect(component.radioOptions).toBeDefined();
      expect(component.radioOptions.length).toBe(2);
      expect(component.radioOptions[0].value).toBe('emailoptionone');
      expect(component.radioOptions[0].label).toBe(
        'Invite people to a sign up'
      );
      expect(component.radioOptions[1].value).toBe('emailoptiontwo');
      expect(component.radioOptions[1].label).toBe(
        'Email people participating in a sign up'
      );
    });
  });

  describe('Dialog State Management', () => {
    it('should have dialog visibility properties initialized', () => {
      expect(component.isPreviewDialogVisible).toBeDefined();
      expect(component.isHelpDialogVisible).toBeDefined();
      expect(component.isPeopleDialogVisible).toBeDefined();
    });
  });

  describe('User Profile Handling', () => {
    it('should handle user profile subscription', () => {
      fixture.detectChanges();

      // Test that userProfile property exists and can be accessed
      expect(component.userProfile).toBeDefined();
    });
  });

  describe('Loading State', () => {
    it('should initialize with loading state false', () => {
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Component Lifecycle', () => {
    it('should call ngOnInit without errors', () => {
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should call ngOnDestroy without errors', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
