import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideToastr } from 'ngx-toastr';
import { provideHttpClient } from '@angular/common/http';
import { SignupSelectionDialogComponent } from './signup-selection-dialog.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ISelectOption } from '@lumaverse/sug-ui';
import { ISignUpItem } from '@services/interfaces/messages-interface/compose.interface';
import { ComposeEmailStateService } from '../services/compose-email-state.service';
import { vi } from 'vitest';

describe('SignupSelectionDialogComponent - Business Rules', () => {
  let component: SignupSelectionDialogComponent;
  let fixture: ComponentFixture<SignupSelectionDialogComponent>;

  const mockSignUpOptions: ISelectOption[] = [
    {
      label: 'Group 1',
      value: 'group1',
      items: [
        {
          label: 'Signup 1',
          value: '101',
          signupData: { signupid: 101, title: 'Signup 1' } as ISignUpItem,
        } as ISelectOption & { signupData?: ISignUpItem },
        {
          label: 'Signup 2',
          value: '102',
          signupData: { signupid: 102, title: 'Signup 2' } as ISignUpItem,
        } as ISelectOption & { signupData?: ISignUpItem },
      ],
    },
    {
      label: 'Group 2',
      value: 'group2',
      items: [
        {
          label: 'Signup 3',
          value: '201',
          signupData: { signupid: 201, title: 'Signup 3' } as ISignUpItem,
        } as ISelectOption & { signupData?: ISignUpItem },
      ],
    },
  ];

  const mockTabGroupsData: ISelectOption[] = [
    { label: 'Tab Group 1', value: 'tab1' },
    { label: 'Tab Group 2', value: 'tab2' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignupSelectionDialogComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideToastr(),
        FormBuilder,
        ComposeEmailStateService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignupSelectionDialogComponent);
    component = fixture.componentInstance;

    // Set @Input properties
    component.signUpOptions = mockSignUpOptions;
    component.tabGroupsData = mockTabGroupsData;
    component.selectedSignups = [];
    component.selectedTabGroups = [];
    component.isSignUpIndexPageSelected = false;

    fixture.detectChanges();
  });

  describe('Business Rule: Component Initialization', () => {
    it('should create component successfully', () => {
      // Given: Component setup in beforeEach

      // When: Component is initialized

      // Then: Component should exist
      expect(component).toBeTruthy();
    });

    it('should initialize with visible false', () => {
      // Given: Component setup

      // When: Checking default visibility

      // Then: Should be hidden by default
      expect(component.visible).toBe(false);
    });

    it('should initialize signUpDialogForm on ngOnInit', () => {
      // Given: Component setup

      // When: ngOnInit is called (already called in beforeEach)

      // Then: Form should be initialized with proper controls
      expect(component.signUpDialogForm).toBeDefined();
      expect(
        component.signUpDialogForm.get('selectedSignupValue')
      ).toBeTruthy();
      expect(component.signUpDialogForm.get('selectedSignups')).toBeTruthy();
      expect(component.signUpDialogForm.get('selectedTabGroups')).toBeTruthy();
    });
  });

  describe('Business Rule: Dialog Configuration', () => {
    it('should have proper dialog configuration', () => {
      // Given: Component initialized

      // When: Checking dialog config

      // Then: Should have correct modal settings
      expect(component.dialogConfig).toBeDefined();
      expect(component.dialogConfig.modal).toBe(true);
      expect(component.dialogConfig.closable).toBe(true);
      expect(component.dialogConfig.width).toBe('480px');
    });

    it('should allow escape key dismissal to be disabled', () => {
      // Given: Dialog config

      // When: Checking escape key setting

      // Then: closeOnEscape should be false
      expect(component.dialogConfig.closeOnEscape).toBe(false);
    });

    it('should allow dismissal on mask click', () => {
      // Given: Dialog config

      // When: Checking dismissableMask

      // Then: Should be dismissable via mask
      expect(component.dialogConfig.dismissableMask).toBe(true);
    });
  });

  describe('Business Rule: Radio Options Display', () => {
    it('should include LinkSpecificSignup option', () => {
      // Given: Component initialized

      // When: Getting dialog radio options
      const options = component.dialogRadioOptions;

      // Then: Should include specific signup option
      const specificOption = options.find(
        (opt) => opt.value === 'LinkSpecificSignup'
      );
      expect(specificOption).toBeDefined();
      expect(specificOption?.label).toBe('Link to specific sign up(s)');
    });

    it('should include LinkMainAccount option', () => {
      // Given: Component initialized

      // When: Getting options
      const options = component.dialogRadioOptions;

      // Then: Should include main account option
      const mainAccountOption = options.find(
        (opt) => opt.value === 'LinkMainAccount'
      );
      expect(mainAccountOption).toBeDefined();
      expect(mainAccountOption?.label).toBe('Link to my main account');
      expect(mainAccountOption?.hasCustomContent).toBe(true);
    });

    it('should include tab groups option when tab groups exist', () => {
      // Given: Tab groups data via @Input
      component.tabGroupsData = mockTabGroupsData;

      // When: Getting radio options
      const options = component.dialogRadioOptions;

      // Then: Should include tab groups option
      const tabGroupOption = options.find(
        (opt) => opt.value === 'LinkSpecifixTabGroup'
      );
      expect(tabGroupOption).toBeDefined();
      expect(tabGroupOption?.label).toBe('Link to specific tab group(s)');
    });

    it('should NOT include tab groups option when no tab groups exist', () => {
      // Given: Empty tab groups data via @Input
      component.tabGroupsData = [];

      // When: Getting radio options
      const options = component.dialogRadioOptions;

      // Then: Should not include tab groups option
      const tabGroupOption = options.find(
        (opt) => opt.value === 'LinkSpecifixTabGroup'
      );
      expect(tabGroupOption).toBeUndefined();
    });

    it('should return correct signUpOptions from state service', () => {
      // Given: State service with signup options

      // When: Getting signUpOptions
      const options = component.signUpOptions;

      // Then: Should match mock data
      expect(options).toEqual(mockSignUpOptions);
    });

    it('should return correct tabGroupsData from state service', () => {
      // Given: State service with tab groups

      // When: Getting tabGroupsData
      const data = component.tabGroupsData;

      // Then: Should match mock data
      expect(data).toEqual(mockTabGroupsData);
    });
  });

  describe('Business Rule: Opening Dialog with Pre-filled Data', () => {
    it('should pre-fill form with selected signups when opening', () => {
      // Given: Selected signups via @Input
      const mockSignups: ISignUpItem[] = [
        { signupid: 101, title: 'Signup 1' } as ISignUpItem,
        { signupid: 102, title: 'Signup 2' } as ISignUpItem,
      ];
      component.selectedSignups = mockSignups;

      // When: Opening dialog
      component.openDialog();

      // Then: Form should be pre-filled with signup data
      expect(component.signUpDialogForm.value.selectedSignupValue).toBe(
        'LinkSpecificSignup'
      );
      expect(component.signUpDialogForm.value.selectedSignups).toEqual([
        '101',
        '102',
      ]);
    });

    it('should pre-fill form with selected tab groups when opening', () => {
      // Given: Selected tab groups via @Input
      component.selectedSignups = [];
      component.selectedTabGroups = [
        { label: 'Tab 1', value: 'tab1' },
        { label: 'Tab 2', value: 'tab2' },
      ];

      // When: Opening dialog
      component.openDialog();

      // Then: Form should be pre-filled with tab group data
      expect(component.signUpDialogForm.value.selectedSignupValue).toBe(
        'LinkSpecifixTabGroup'
      );
      expect(component.signUpDialogForm.value.selectedTabGroups).toEqual([
        'tab1',
        'tab2',
      ]);
    });

    it('should pre-fill form with main account selection when index page selected', () => {
      // Given: Index page selected via @Input
      component.selectedSignups = [];
      component.selectedTabGroups = [];
      component.isSignUpIndexPageSelected = true;

      // When: Opening dialog
      component.openDialog();

      // Then: Form should be pre-filled with main account option
      expect(component.signUpDialogForm.value.selectedSignupValue).toBe(
        'LinkMainAccount'
      );
      expect(component.signUpDialogForm.value.selectedSignups).toEqual([]);
      expect(component.signUpDialogForm.value.selectedTabGroups).toEqual([]);
    });

    it('should not pre-fill when no selection exists', () => {
      // Given: No selections via @Input
      component.selectedSignups = [];
      component.selectedTabGroups = [];
      component.isSignUpIndexPageSelected = false;

      // When: Opening dialog
      component.openDialog();

      // Then: Form should have null radio value
      expect(component.signUpDialogForm.value.selectedSignupValue).toBeNull();
      expect(component.signUpDialogForm.value.selectedSignups).toEqual([]);
      expect(component.signUpDialogForm.value.selectedTabGroups).toEqual([]);
    });

    it('should emit visibleChange true when opening', () => {
      // Given: Visibility listener
      let emittedValue: boolean | null = null;
      component.visibleChange.subscribe((value) => {
        emittedValue = value;
      });

      // When: Opening dialog
      component.openDialog();

      // Then: Should emit true
      expect(emittedValue).toBe(true);
      expect(component.visible).toBe(true);
    });
  });

  describe('Business Rule: Closing Dialog with Selections', () => {
    it('should emit selected tab groups on confirm', () => {
      // Given: Form with tab group selection
      const signupsSpy = vi.spyOn(component.selectedSignupsChange, 'emit');
      const tabGroupsSpy = vi.spyOn(component.selectedTabGroupsChange, 'emit');
      const indexPageSpy = vi.spyOn(
        component.signUpIndexPageSelectedChange,
        'emit'
      );

      component.signUpDialogForm.patchValue({
        selectedSignupValue: 'LinkSpecifixTabGroup',
        selectedTabGroups: ['tab1', 'tab2'],
      });

      // When: Closing without cancellation
      component.closeDialog(false);

      // Then: Should emit tab groups
      expect(signupsSpy).toHaveBeenCalledWith([]);
      expect(tabGroupsSpy).toHaveBeenCalledWith([
        { label: 'Tab Group 1', value: 'tab1' },
        { label: 'Tab Group 2', value: 'tab2' },
      ]);
      expect(indexPageSpy).toHaveBeenCalledWith(false);
    });

    it('should emit index page selected on main account confirm', () => {
      // Given: Form with main account selection
      const signupsSpy = vi.spyOn(component.selectedSignupsChange, 'emit');
      const tabGroupsSpy = vi.spyOn(component.selectedTabGroupsChange, 'emit');
      const indexPageSpy = vi.spyOn(
        component.signUpIndexPageSelectedChange,
        'emit'
      );

      component.signUpDialogForm.patchValue({
        selectedSignupValue: 'LinkMainAccount',
      });

      // When: Closing without cancellation
      component.closeDialog(false);

      // Then: Should emit index page selected
      expect(signupsSpy).toHaveBeenCalledWith([]);
      expect(tabGroupsSpy).toHaveBeenCalledWith([]);
      expect(indexPageSpy).toHaveBeenCalledWith(true);
    });

    it('should close dialog and emit visibleChange false on confirm', () => {
      // Given: Valid form and visibility listener
      let emittedValue: boolean | null = null;
      component.visibleChange.subscribe((value) => {
        emittedValue = value;
      });
      component.signUpDialogForm.patchValue({
        selectedSignupValue: 'LinkMainAccount',
      });

      // When: Closing without cancellation
      component.closeDialog(false);

      // Then: Should emit false and update visible
      expect(emittedValue).toBe(false);
      expect(component.visible).toBe(false);
    });
  });

  describe('Business Rule: Closing Dialog on Cancel', () => {
    it('should not emit changes when cancelled', () => {
      // Given: Form with selections and spies on emitters
      const signupsSpy = vi.spyOn(component.selectedSignupsChange, 'emit');
      const tabGroupsSpy = vi.spyOn(component.selectedTabGroupsChange, 'emit');
      const indexPageSpy = vi.spyOn(
        component.signUpIndexPageSelectedChange,
        'emit'
      );

      component.signUpDialogForm.patchValue({
        selectedSignupValue: 'LinkSpecificSignup',
        selectedSignups: ['101'],
      });

      // When: Closing with cancellation
      component.closeDialog(true);

      // Then: Should not emit any changes
      expect(signupsSpy).not.toHaveBeenCalled();
      expect(tabGroupsSpy).not.toHaveBeenCalled();
      expect(indexPageSpy).not.toHaveBeenCalled();
    });
  });

  describe('Business Rule: Selection Change Handlers', () => {
    it('should emit updated group options on signup selection change', () => {
      // Given: Component with signup options and spy
      const spy = vi.spyOn(component.signUpOptionsChange, 'emit');
      const newSelection = { value: ['101'] };

      // When: Signup selection changes
      component.onSignUpSelectionChange(newSelection);

      // Then: Should emit updated options
      expect(spy).toHaveBeenCalled();
    });

    it('should update form when tab group selection changes', () => {
      // Given: Component initialized
      const newSelection = { value: ['tab1', 'tab2'] };

      // When: Tab group selection changes
      component.onTabGroupSelectionChange(newSelection);

      // Then: Form should be updated
      expect(component.signUpDialogForm.value.selectedTabGroups).toEqual([
        'tab1',
        'tab2',
      ]);
    });
  });

  describe('Business Rule: Group Options Cross-Selection Prevention', () => {
    it('should emit disabled second group when first group has selection', () => {
      // Given: First group has a selected item and spy
      const spy = vi.spyOn(component.signUpOptionsChange, 'emit');
      const selectedValues = ['101']; // Item from first group

      // When: Updating group options state
      component['updateGroupOptionsState'](selectedValues);

      // Then: Should emit options with second group disabled
      expect(spy).toHaveBeenCalled();
    });

    it('should emit disabled first group when second group has selection', () => {
      // Given: Second group has a selected item and spy
      const spy = vi.spyOn(component.signUpOptionsChange, 'emit');
      const selectedValues = ['201']; // Item from second group

      // When: Updating group options state
      component['updateGroupOptionsState'](selectedValues);

      // Then: Should emit options with first group disabled
      expect(spy).toHaveBeenCalled();
    });

    it('should emit all options enabled when selection is empty', () => {
      // Given: Empty selection and spy
      const spy = vi.spyOn(component.signUpOptionsChange, 'emit');
      const selectedValues: string[] = [];

      // When: Updating group options state
      component['updateGroupOptionsState'](selectedValues);

      // Then: Should emit options with all enabled
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Business Rule: Form Validation', () => {
    it('should not close when no radio option selected', () => {
      // Given: Form with no radio selection
      component.signUpDialogForm.patchValue({
        selectedSignupValue: null,
      });
      const toastrSpy = vi
        .spyOn(component['toastr'], 'error')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => null as any);

      // When: Attempting to close
      component.closeDialog(false);

      // Then: Should show alert and stay open
      expect(toastrSpy).toHaveBeenCalledWith(
        'Please select an option',
        'Error'
      );
      toastrSpy.mockRestore();
    });

    it('should not close when specific signup selected but no signups chosen', () => {
      // Given: Radio selected but no signups
      component.signUpDialogForm.patchValue({
        selectedSignupValue: 'LinkSpecificSignup',
        selectedSignups: [],
      });
      const toastrSpy = vi
        .spyOn(component['toastr'], 'error')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => null as any);

      // When: Attempting to close
      component.closeDialog(false);

      // Then: Should show validation alert
      expect(toastrSpy).toHaveBeenCalledWith(
        'Please select at least one sign up',
        'Error'
      );
      toastrSpy.mockRestore();
    });

    it('should not close when tab groups selected but none chosen', () => {
      // Given: Tab groups radio selected but no groups
      component.signUpDialogForm.patchValue({
        selectedSignupValue: 'LinkSpecifixTabGroup',
        selectedTabGroups: [],
      });
      const toastrSpy = vi
        .spyOn(component['toastr'], 'error')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => null as any);

      // When: Attempting to close
      component.closeDialog(false);

      // Then: Should show validation alert
      expect(toastrSpy).toHaveBeenCalledWith(
        'Please select at least one tab group',
        'Error'
      );
      toastrSpy.mockRestore();
    });
  });
});
