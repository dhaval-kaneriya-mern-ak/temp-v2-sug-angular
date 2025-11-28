import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ISelectOption } from '@lumaverse/sug-ui';
import {
  ISignUpItem,
  IGroupMember,
  IRecipient,
  ISelectPortalOption,
  IMemberInfoDto,
  IFileItem,
} from '@services/interfaces/messages-interface/compose.interface';

/**
 * Shared state service for compose email component and its children
 * Manages state that needs to be shared across multiple components
 */
@Injectable()
export class ComposeEmailStateService {
  // Selected signups state
  private selectedSignupsSubject = new BehaviorSubject<ISignUpItem[]>([]);
  selectedSignups$ = this.selectedSignupsSubject.asObservable();

  // Selected tab groups state
  private selectedTabGroupsSubject = new BehaviorSubject<ISelectOption[]>([]);
  selectedTabGroups$ = this.selectedTabGroupsSubject.asObservable();

  // Sign up index page selection state
  private isSignUpIndexPageSelectedSubject = new BehaviorSubject<boolean>(
    false
  );
  isSignUpIndexPageSelected$ =
    this.isSignUpIndexPageSelectedSubject.asObservable();

  // Selected groups (people) state
  private selectedGroupsSubject = new BehaviorSubject<ISelectOption[]>([]);
  selectedGroups$ = this.selectedGroupsSubject.asObservable();

  private selectedAttachmentSubject = new BehaviorSubject<IFileItem[]>([]);
  selectedAttachment$ = this.selectedAttachmentSubject.asObservable();

  //selected portal pages state
  private selectedPortalPagesSubject = new BehaviorSubject<
    ISelectPortalOption[]
  >([]);
  selectedPortalPages$ = this.selectedPortalPagesSubject.asObservable();

  // Recipient count state
  private recipientCountSubject = new BehaviorSubject<number>(0);
  recipientCount$ = this.recipientCountSubject.asObservable();

  // Recipients data state
  private recipientsSubject = new BehaviorSubject<
    (IGroupMember | IRecipient)[]
  >([]);
  recipients$ = this.recipientsSubject.asObservable();
  memberIndexPageUrl = '';

  // People selection form data (for restoring dialog state)
  private peopleSelectionDataSubject = new BehaviorSubject<{
    selectedValue: string | null;
    selectedGroups: string[];
    selectedPortalPages: string[];
    manualEmails: string;
    groupEmailAlias: string;
    useGroupAlias: boolean;
    includeNonGroupMembers: boolean;
    manualEmailsGroup: string[];
    rsvpResponseyes: boolean;
    rsvpResponseno: boolean;
    rsvpResponsemaybe: boolean;
    rsvpResponsenoresponse: boolean;
  }>({
    selectedValue: null,
    selectedGroups: [],
    selectedPortalPages: [],
    manualEmails: '',
    groupEmailAlias: '',
    useGroupAlias: false,
    includeNonGroupMembers: false,
    manualEmailsGroup: [],
    rsvpResponseyes: false,
    rsvpResponseno: false,
    rsvpResponsemaybe: false,
    rsvpResponsenoresponse: false,
  });
  peopleSelectionData$ = this.peopleSelectionDataSubject.asObservable();

  // Date slots selection state
  private selectedDateSlotsSubject = new BehaviorSubject<
    Array<{
      slotitemid: number;
      starttime: string;
      item: string;
      location: string;
      qtytaken: number;
      qtyremaining: number;
      signedupmembers: string;
    }>
  >([]);
  selectedDateSlots$ = this.selectedDateSlotsSubject.asObservable();

  // Date slots selection state
  private selectedMemberGroupsSubject = new BehaviorSubject<IMemberInfoDto[]>(
    []
  );
  selectedMemberGroups$ = this.selectedMemberGroupsSubject.asObservable();
  // Available options data
  private signUpOptionsSubject = new BehaviorSubject<ISelectOption[]>([]);
  signUpOptions$ = this.signUpOptionsSubject.asObservable();

  private tabGroupsDataSubject = new BehaviorSubject<ISelectOption[]>([]);
  tabGroupsData$ = this.tabGroupsDataSubject.asObservable();

  private groupOptionsSubject = new BehaviorSubject<ISelectOption[]>([]);
  groupOptions$ = this.groupOptionsSubject.asObservable();

  private subAdminsDataSubject = new BehaviorSubject<ISelectOption[]>([]);
  subAdminsData$ = this.subAdminsDataSubject.asObservable();

  private portalSignUpOptionsSubject = new BehaviorSubject<
    ISelectPortalOption[]
  >([]);
  portalSignUpOptions$ = this.portalSignUpOptionsSubject.asObservable();

  // Getters
  get selectedSignups(): ISignUpItem[] {
    return this.selectedSignupsSubject.value;
  }

  get selectedTabGroups(): ISelectOption[] {
    return this.selectedTabGroupsSubject.value;
  }

  get isSignUpIndexPageSelected(): boolean {
    return this.isSignUpIndexPageSelectedSubject.value;
  }

  get selectedGroups(): ISelectOption[] {
    return this.selectedGroupsSubject.value;
  }

  get selectedAttachment(): IFileItem[] {
    return this.selectedAttachmentSubject.value;
  }

  get recipientCount(): number {
    return this.recipientCountSubject.value;
  }

  get recipients(): (IGroupMember | IRecipient)[] {
    return this.recipientsSubject.value;
  }

  get selectedPortalPages(): ISelectPortalOption[] {
    return this.selectedPortalPagesSubject.value;
  }

  get peopleSelectionData() {
    return this.peopleSelectionDataSubject.value;
  }

  get selectedDateSlots() {
    return this.selectedDateSlotsSubject.value;
  }

  get selectedMemberGroups() {
    return this.selectedMemberGroupsSubject.value;
  }

  get signUpOptions(): ISelectOption[] {
    return this.signUpOptionsSubject.value;
  }

  get portalSignUpOptions(): ISelectPortalOption[] {
    return this.portalSignUpOptionsSubject.value;
  }

  get tabGroupsData(): ISelectOption[] {
    return this.tabGroupsDataSubject.value;
  }

  get groupOptions(): ISelectOption[] {
    return this.groupOptionsSubject.value;
  }

  get subAdminsData(): ISelectOption[] {
    return this.subAdminsDataSubject.value;
  }

  get getMemberIndexPageUrl(): string {
    return this.memberIndexPageUrl;
  }

  // Setters
  setSelectedSignups(signups: ISignUpItem[]): void {
    this.selectedSignupsSubject.next(signups);
    // Reset people selection when signups change
    this.resetPeopleSelection();
  }

  setSelectedAttachment(attachments: IFileItem[]): void {
    this.selectedAttachmentSubject.next(attachments);
  }

  setSelectedPortalPages(pages: ISelectPortalOption[]): void {
    this.selectedPortalPagesSubject.next(pages);
  }

  setMemberIndexPageUrl(url: string): void {
    this.memberIndexPageUrl = url;
  }

  setSelectedTabGroups(tabGroups: ISelectOption[]): void {
    this.selectedTabGroupsSubject.next(tabGroups);
    // Reset people selection when tab groups change
    this.resetPeopleSelection();
  }

  setSignUpIndexPageSelected(selected: boolean): void {
    this.isSignUpIndexPageSelectedSubject.next(selected);

    // If deselecting index page and no other selections remain, reset signup options
    if (
      !selected &&
      this.selectedSignupsSubject.value.length === 0 &&
      this.selectedTabGroupsSubject.value.length === 0
    ) {
      this.resetSignUpOptionsState();
    }

    // Reset people selection when index page selection changes
    this.resetPeopleSelection();
  }

  setSelectedGroups(groups: ISelectOption[]): void {
    this.selectedGroupsSubject.next(groups);
  }

  setRecipientCount(count: number): void {
    this.recipientCountSubject.next(count);
  }

  setRecipients(recipients: (IGroupMember | IRecipient)[]): void {
    this.recipientsSubject.next(recipients);
  }

  setPeopleSelectionData(
    data: Partial<typeof this.peopleSelectionDataSubject.value>
  ): void {
    const currentData = this.peopleSelectionDataSubject.value;
    this.peopleSelectionDataSubject.next({ ...currentData, ...data });
  }

  setSelectedDateSlots(
    slots: Array<{
      slotitemid: number;
      starttime: string;
      item: string;
      location: string;
      qtytaken: number;
      qtyremaining: number;
      signedupmembers: string;
    }>
  ): void {
    this.selectedDateSlotsSubject.next(slots);
  }

  setSelectedMemberGroups(options: IMemberInfoDto[]): void {
    this.selectedMemberGroupsSubject.next(options);
  }

  setSignUpOptions(options: ISelectOption[]): void {
    this.signUpOptionsSubject.next(options);
  }

  setPortalSignUpOptions(options: ISelectPortalOption[]): void {
    this.portalSignUpOptionsSubject.next(options);
  }

  setTabGroupsData(data: ISelectOption[]): void {
    this.tabGroupsDataSubject.next(data);
  }

  setGroupOptions(options: ISelectOption[]): void {
    this.groupOptionsSubject.next(options);
  }

  setSubAdminsData(data: ISelectOption[]): void {
    this.subAdminsDataSubject.next(data);
  }

  // Helper methods
  addSignup(signup: ISignUpItem): void {
    const current = this.selectedSignupsSubject.value;
    this.selectedSignupsSubject.next([...current, signup]);
    // Reset people selection when signup is added
    this.resetPeopleSelection();
  }

  removeSignup(index: number): void {
    const current = this.selectedSignupsSubject.value;
    const updated = current.filter((_, i) => i !== index);
    this.selectedSignupsSubject.next(updated);

    // If no signups left, reset signup options to enabled state
    if (updated.length === 0) {
      this.resetSignUpOptionsState();
    }

    // Reset people selection when signup is removed
    this.resetPeopleSelection();
  }

  removeTabGroup(index: number): void {
    const current = this.selectedTabGroupsSubject.value;
    const updated = current.filter((_, i) => i !== index);
    this.selectedTabGroupsSubject.next(updated);

    // If no tab groups left and no signups left, reset signup options
    if (
      updated.length === 0 &&
      this.selectedSignupsSubject.value.length === 0
    ) {
      this.resetSignUpOptionsState();
    }

    // Reset people selection when tab group is removed
    this.resetPeopleSelection();
  }

  removePortalPage(index: number): void {
    const current = this.selectedPortalPagesSubject.value;
    const updated = current.filter((_, i) => i !== index);
    this.selectedPortalPagesSubject.next(updated);

    if (updated.length === 0) {
      this.resetSignUpOptionsState();
    }

    this.resetPeopleSelection();
  }

  removeSelectedSlot(index: number): void {
    const current = this.selectedDateSlotsSubject.value;
    this.selectedDateSlotsSubject.next(current.filter((_, i) => i !== index));
    // Update recipient count when slot is removed
    this.setRecipientCount(this.selectedDateSlotsSubject.value.length);
  }

  removeSelectedMemberGroup(index: number): void {
    const current = this.selectedMemberGroupsSubject.value;
    this.selectedMemberGroupsSubject.next(
      current.filter((_, i) => i !== index)
    );
    this.setRecipientCount(this.selectedMemberGroupsSubject.value.length);
  }

  resetPeopleSelection(): void {
    // Clear selected groups
    this.selectedGroupsSubject.next([]);
    // Clear recipient count and recipients
    this.recipientCountSubject.next(0);
    this.recipientsSubject.next([]);
    // Clear date slots
    this.selectedDateSlotsSubject.next([]);
    this.selectedMemberGroupsSubject.next([]);
    // Reset people selection form data
    this.peopleSelectionDataSubject.next({
      selectedValue: null,
      selectedGroups: [],
      selectedPortalPages: [],
      manualEmails: '',
      groupEmailAlias: '',
      useGroupAlias: false,
      includeNonGroupMembers: false,
      manualEmailsGroup: [],
      rsvpResponseyes: false,
      rsvpResponseno: false,
      rsvpResponsemaybe: false,
      rsvpResponsenoresponse: false,
    });
  }

  resetSignUpOptionsState(): void {
    // Reset all signup options to enabled state
    const currentOptions = this.signUpOptionsSubject.value;
    const resetOptions = currentOptions.map((group) => ({
      ...group,
      disabled: false,
      items: group.items?.map((item: ISelectOption) => ({
        ...item,
        disabled: false,
      })),
    }));
    this.signUpOptionsSubject.next(resetOptions);
  }

  clearAllSelections(): void {
    this.selectedSignupsSubject.next([]);
    this.selectedTabGroupsSubject.next([]);
    this.isSignUpIndexPageSelectedSubject.next(false);
    this.selectedGroupsSubject.next([]);
    this.recipientCountSubject.next(0);
    this.recipientsSubject.next([]);
    this.selectedDateSlotsSubject.next([]);
    this.selectedMemberGroupsSubject.next([]);
    this.selectedPortalPagesSubject.next([]);
    this.peopleSelectionDataSubject.next({
      selectedValue: null,
      selectedGroups: [],
      selectedPortalPages: [],
      manualEmails: '',
      groupEmailAlias: '',
      useGroupAlias: false,
      includeNonGroupMembers: false,
      manualEmailsGroup: [],
      rsvpResponseyes: false,
      rsvpResponseno: false,
      rsvpResponsemaybe: false,
      rsvpResponsenoresponse: false,
    });
    // Ensure any disabled sign up options are reset when clearing selections
    this.resetSignUpOptionsState();
  }

  reset(): void {
    this.clearAllSelections();
  }
}
