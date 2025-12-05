/**
 * Interface for member verification details data
 */
export interface IMemberVerificationData {
  isFullMember: number;
  hasPword: boolean;
  verified: number;
  isFeatureEnabled: boolean;
  isFullAndVerified: boolean;
}

/**
 * Interface for the complete API response from getMemberVerificationDetails
 * API Endpoint: https://test.signupgenius.rocks/SUGboxAPI.cfm?go=m.getMemberVerificationDetails
 */
export interface IMemberVerificationDetailsResponse {
  MESSAGE: string[];
  DATA: IMemberVerificationData;
  SUCCESS: boolean;
  CODE: string;
}

/**
 * Interface for member email limits data
 */
export interface IMemberEmailLimitsData {
  senttextforthemonth: number;
  monthlylimit: number;
  textmessage: number;
  limitMonth: number;
  endDate: string;
  startDate: string;
  dailyLimit: number;
  sentForTheMonth: number;
  limitToday: number;
  sentToday: number;
  textmessagelimit: number;
}

/**
 * Interface for the complete API response from getMemberEmailLimits
 * API Endpoint: https://test.signupgenius.rocks/SUGboxAPI.cfm?go=t.getMemberEmailLimits
 */
export interface IMemberEmailLimitsResponse {
  MESSAGE: string;
  DATA: IMemberEmailLimitsData;
  SUCCESS: boolean;
  CODE: string;
}

/**
 * Interface for SignUp item data
 */

export interface ISignUpItem {
  signupid: number;
  memberimagedisabled: boolean;
  ownerid: number;
  mode: string;
  isapproved: boolean;
  community: string;
  communityid: number;
  memberimageowner: number;
  customimagedisabled: boolean;
  iscomplete: boolean;
  serverfilename: string;
  customimagefilename: string;
  partialimagepath: string;
  signupimage: string;
  title: string;
  fulltitle: string;
  themeid: number;
  signupstatus: string;
  themeclientfilename: string;
  themeserverfilename: string;
  themedisabled: boolean;
  themeimageapproved: boolean;
  themeowner: string;
  themememberimageid: number;
  thememberid: number;
  themememberid: number;
  contactname: string;
  hasads: boolean;
  hasadsdisabled: boolean;
  imageheight: number;
  imagewidth: number;
  zonename: string;
  urlid?: string;
  memberimageid?: number;
  enddate?: string;
  startdate?: string;
  favoriteid?: number;
  haspassword?: string | boolean;
  passcode?: string;
  remindertemplate?: string | number;
  confirmationtemplate?: string | number;
}

export interface ISelectPortalOption {
  label?: string;
  value?: string | number;
  id?: number;
  active?: boolean;
  associatedthemes?: number[];
  datecreated?: number;
  dateupdated?: number;
  embeddedmode?: boolean;
  memberid?: number;
  portalcolorschemeid?: number;
  removebranding?: boolean;
  title?: string;
  urlkey?: string;
}

export interface IPortalSignupResponse {
  message?: string[];
  data?: ISelectPortalOption[];
  success?: boolean;
}

export interface IMemberIndexPageResponse {
  message?: string[];
  data?: {
    url: string;
  };
  success?: boolean;
}

/**
 * Interface for pagination data
 */
export interface ISignupPaginationData {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Interface for the complete API response from getSignUpList
 * API Endpoint: https://apiz.signupgenius.rocks/v3/signups/created
 */
export interface ISignUpListResponse {
  message: string[];
  data: ISignUpItem[];
  success: boolean;
  pagination: ISignupPaginationData;
  links: ILinkObject;
}

/**
 * Interface for group/community data
 */
export interface IGroupItem {
  membercount: number;
  signupcount: number;
  title: string;
  id: number;
}

/**
 * Interface for the complete API response from getGroupforMembers
 * API Endpoint: https://test.signupgenius.rocks/SUGboxAPI.cfm?go=m.getGroupforMembers
 */
export interface IGroupListResponse {
  message: string[];
  data: IGroupItem[];
  success: boolean;
  links: ILinkObject;
}
// LinkObject interface
export interface ILinkObject {
  self: string;
  previous: string | null;
  next: string | null;
}

/**
 * Interface for group member data
 */
export interface IGroupMember {
  id: number;
  communitymemberid: number;
  firstname: string;
  lastname: string;
  email: string;
  isgroupemail: boolean;
  textoptin?: boolean;
  profilepicdata?: string;
}

/**
 * Interface for pagination data
 */
export interface IPaginationData {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Interface for recipient from v3 Recipients API
 */
export interface IRecipient {
  memberid: number;
  email: string;
  mobile: string;
  displayname: string;
  smsoptin: boolean;
}

/**
 * Interface for recipients data from v3 API
 */
export interface IRecipientsData {
  sentto: string; // Human-readable description of recipient groups
  recipients: IRecipient[]; // Array of recipients
}

/**
 * Interface for group members data structure (legacy and v3 combined)
 */
export interface IGroupMembersData {
  groupid?: number;
  title?: string;
  members?: IGroupMember[];
  data?: IRecipientsData; // Nested data from v3 API response
}

export interface IGroupMemberData {
  members: IGroupMember[];
  title: string;
  id: number;
}

/**
 * Interface for the complete API response from getGroupMembers
 * API Endpoint: /v3/messages/recipients (old: SUGboxAPI.cfm?go=t.getGroupMembers)
 */
export interface IGroupMembersResponse {
  success: boolean;
  message: string[];
  data: IGroupMembersData;
  pagination?: IPaginationData;
  links?: ILinkObject;
}

export interface IGroupMembersListResponse {
  success: boolean;
  message: string[];
  data: IGroupMemberData;
}

/**
 * Interface for the complete API response from getCloudSpongeServices
 * API Endpoint: https://test.signupgenius.rocks/SUGboxAPI.cfm?go=t.getCloudSpongeServices
 */
export interface ICloudSpongeServicesResponse {
  MESSAGE: string[];
  DATA: string;
  SUCCESS: boolean;
  CODE: string;
}

/**
 * Interface for sub-admin data
 */
export interface ISubAdmin {
  firstname: string;
  id: number;
  lastname: string;
  email: string;
}

/**
 * Interface for the complete API response from getSubAdmins
 * API Endpoint: https://test.signupgenius.rocks/SUGboxAPI.cfm?go=t.getSubAdmins
 */
export interface ISubAdminsResponse {
  message: string[];
  data: ISubAdmin[];
  success: boolean;
}

/**
 * Interface for member creation history
 */
export interface ICreationHistory {
  createdSignUpsLast30Days: number;
  SignUpsCreated: number;
  lastDateCreatedSignUp: string;
  SignUpsCreatedNW: number;
  createdSignUpsLast6Months: number;
  createdSignUpsLast12Months: number;
  lastDateSignUpModified: string;
  createdSignUpsLast3Months: number;
}

/**
 * Interface for member contact information
 */
export interface IMemberContact {
  country: number;
  address2: string;
  countryiso2: string;
  zipcode: string;
  phonetype: string;
  address1: string;
  companyname: string;
  state: string;
  city: string;
  phone: string;
}

/**
 * Interface for no ads license information
 */
export interface INoAdsLicense {
  totallicenses: number;
  signupids: number[];
  unusedLicenses: number;
}

/**
 * Interface for member features
 */
export interface IMemberFeatures {
  messageRecipientPerDay: number;
  locationSearch: boolean;
  EmbeddedSignUps: boolean;
  participantTier: number;
  portalPages: boolean;
  CustomReminders: number;
  messageRecipientPerSend: number;
  manageCreatedSignUps: boolean;
  hidePastDates: number;
  signuptabbing: boolean;
  productImages: boolean;
  SignUpProtection: boolean;
  GeniusTips: boolean;
  HideNumberWanted: boolean;
  ThemeOverride: string;
  supQrCodes: boolean;
  CustomQuestions: number;
  HiddenFields: number;
  CustomURL: boolean;
  CustomConfirmations: number;
  limitQuantity: number;
  lumapay_rate: string;
  EmbeddedPortalPages: boolean;
  EmbedPortalPages: boolean;
  geniusDriveSizeMB: number;
  MultiAdmins: number;
  messageRecipientPerMonth: number;
  wepay_rate: string;
  messageRecipientAutoApprove: number;
  removeBranding: boolean;
  MultiNotify: number;
  lockDays: number;
  NonProfitEasy: boolean;
  startCloseSignUp: number;
  proThemeBuilder: number;
  ssoAuth: boolean;
  globalCustomContact: boolean;
  backtowebsite: boolean;
  slotCountLimit: string;
  noAds: number;
  waitlist: boolean;
  CustomImages: number;
  calendarsync: boolean;
  NoAdsLicenses: number;
  phoneSupport: number;
  textmessagelimit: number;
}

/**
 * Interface for date format options
 */
export interface IMemberDateFormatOption {
  selected: boolean;
  format: string;
}

/**
 * Interface for timezone information
 */
export interface IMemberTimezone {
  timezoneid: number;
  tzshort: string;
  timezone: string;
}

/**
 * Interface for date and timezone settings
 */
export interface IDateTzSettings {
  dateformats: IMemberDateFormatOption[];
  timezone: IMemberTimezone;
}

/**
 * Interface for signup setting option
 */
export interface ISignupSettingOption {
  FORCE: boolean;
  VALUE: string | boolean;
}

/**
 * Interface for signup settings
 */
export interface ISignupSettings {
  reminddays: ISignupSettingOption;
  removeBranding: ISignupSettingOption;
  reminders: ISignupSettingOption;
  newWizard: ISignupSettingOption;
  globalCustomContact: ISignupSettingOption;
  socialshare: ISignupSettingOption;
  showProfilePics: ISignupSettingOption;
  calendarView: ISignupSettingOption;
  noGroupAdd: ISignupSettingOption;
  allowswap: ISignupSettingOption;
  notifyme: ISignupSettingOption;
}

/**
 * Interface for member info data
 */
export interface IMemberInfoData {
  creationhistory: ICreationHistory;
  isAdmin: boolean;
  mobile: string;
  parentID: number;
  hasPayments: boolean;
  membercontact: IMemberContact;
  noadslicense: INoAdsLicense;
  firstName: string;
  features: IMemberFeatures;
  datetzsettings: IDateTzSettings;
  isEligibleForTrial: boolean;
  productCode: string;
  previoussubscriber: boolean;
  email: string;
  hasMemberOptIns: boolean;
  signupsettings: ISignupSettings;
  paymentProvider: string;
  activesignups: number;
  isMemberPro: boolean;
  zoneid: number;
  lastName: string;
  productLabel: string;
  productRank: number;
  fullName: string;
  isTrialUser: boolean;
  memberID: number;
  currency: string;
}

/**
 * Interface for the complete API response from getMemberInfo
 * API Endpoint: https://test.signupgenius.rocks/SUGboxAPI.cfm?go=m.getMemberInfo
 */
export interface IMemberInfoResponse {
  MESSAGE: string;
  DATA: IMemberInfoData;
  SUCCESS: boolean;
  CODE: string;
}

/**
 * Interface for SignUp data from getSignUpList API
 */
export interface ISignUpData {
  CONTACTNAME: string;
  TEXTCOLOR2: string;
  USERSVP: number;
  URLID: string;
  THEMEID: number;
  REMINDERTEMPLATE: string | number;
  TABGROUPID: number;
  ITEMSORT: string;
  COMMUNITYID: number;
  BACKGROUNDIMAGE: string;
  PASSCODE: string;
  NOTIFICATIONIDS: string;
  TEXTCOLOR1: string;
  HASPASSWORD: string;
  id: number;
  NODATE: number;
  SENDCONFIRMATIONS: string | number;
  CONFIRMATIONTEMPLATE: string | number;
  BACKGROUNDCOLOR: string;
  title: string;
}

/**
 * Interface for the complete API response from getSignUpList
 * API Endpoint: https://test.signupgenius.rocks/SUGboxAPI.cfm?go=s.getSignUpList
 */
export interface IGetSignUpListResponse {
  message: string;
  data: ISignUpData[];
  success: boolean;
  code: string;
}

/**
 * Interface for Date Slot Item
 */
export interface IDateSlotItem {
  slotid: number;
  signupid: number;
  starttime: string;
  usetime: boolean;
  endtime: string;
  location: string;
  slotitemid: number;
  itemid: number;
  item: string;
  qty: number;
  comment: string;
  itemorder: number;
  paymenttype: string;
  price: number;
  goalamount: number;
  minimumamount: number;
  paymentrequired: boolean;
  donotshow: boolean;
  displayraised: boolean;
  optionnamelist: string;
  optionpricelist: string;
  memberimageid: number;
  longdescription: string;
  forall: boolean;
  discounttype: string;
  discountprice: number;
  discountcriteria: string;
  waitlist: boolean;
  qtytaken: number;
  qtyremaining: number;
  nodate: boolean;
  signedupmembers?: string;
  waitlistedmembers?: string;
}

export interface DateSlot {
  slotitemid: number;
  slotid: number;
  signupid: number;
  starttime: string;
  endtime: string;
  usetime: boolean;
  item: string;
  location: string;
  qtytaken: number;
  qtyremaining: number;
  qty: number;
  signedupmembers?: string;
  waitlistedmembers?: string;
  comment?: string;
  itemorder: number;
  nodate: boolean;
  waitlist: boolean;
}

export interface DateSlotDisplay {
  slotitemid: number;
  starttime: string;
  item: string;
  signedupmembers: string;
  isWaitlistedRow?: boolean;
  originalSlot?: DateSlot;
}

/**
 * Interface for Date Slots Pagination
 */
export interface IDateSlotsPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Interface for Date Slots Request Body
 */
export interface IDateSlotsRequest {
  includeSignedUpMembers?: boolean;
  startDate?: string; // ISO date string for date range filtering
  endDate?: string; // ISO date string for date range filtering
  pagination?: {
    page?: number;
    limit?: number;
    sortby?: string;
  };
}

/**
 * Interface for Date Slots API Response
 */
export interface IDateSlotsResponse {
  success: boolean;
  message: string[];
  data: IDateSlotItem[];
  pagination?: IDateSlotsPagination;
}

export interface SignupOptionGroup {
  label: string;
  value: string;
  items: Array<{
    label: string;
    value: string;
    signupData: ISignUpItem;
  }>;
}

/**
 * Error message can be either a string or an object with details
 */
export type MessageErrorItem = string | { details: string; message?: string };

export interface MessageResponse {
  success: boolean;
  message: MessageErrorItem[];
  data: MessageByIdData;
}

export interface MessageByIdData {
  messageid: number;
  memberid: number;
  subject: string;
  body: string;
  replyto: [];
  messagetype: string;
  messagetypeid: number;
  contactname: string;
  fromemail: string;
  zonename: string;
  status: string;
  createdby: number;
  themeid: number;
  theme: string;
  sentto: string;
  scheduled: boolean;
  sendastext?: boolean;
  sendasemail?: boolean;

  signups?: {
    signupid: number;
    signuptitle: string;
  }[];

  themes?: {
    themeid: number;
    themetitle: string;
  }[];

  groups?: {
    groupid: number;
    groupname: string;
  }[];

  portals?: {
    portalid: number;
    portaltitle: string;
    portalurl: string;
  }[];

  tabgroups?: {
    tabgroupid: number;
    tabgroupname: string;
  }[];

  addEmails?: string;

  sendtotype: string;
  signUpType?: string;

  attachments?: {
    fileid: number;
    fileurl: string;
  }[];
}

export interface IMessagePreviewRequest {
  fromname: string;
  subject: string;
  message: string;
  emailtype: string;
  themeid: number;
  replyto?: string[];
  signupids?: number[];
  signuptype?: string;
  tabgroupids?: number[];
  portalids?: number[];
  sendto?: Array<{
    id: number;
    displayname: string;
    ischecked: boolean;
    membercount?: number;
  }>;
  sendtotype?: string;
  attachmentids?: number[];
}

/**
 * Interface for Preview API Response
 */
export interface IMessagePreviewResponse {
  success: boolean;
  message: [];
  data: {
    htmlpreview: string;
    textpreview: string;
  };
}

/**
 * Enum for target audience identifier (sentto)
 */
export enum SentTo {
  NOT_SIGNED_UP = 'notsignedup',
  SIGNED_UP = 'signedup',
  SIGNED_UP_AND_WAITLIST = 'signedupandwaitlisted',
  WAITLIST = 'waitlisted',
  CUSTOM = 'custom',
  ALL = 'all',
  MEMBERS = 'members',
  IMPORT = 'import',
  ALL_INCLUDE_NON_GROUP_MEMBERS = 'allincludenongroupmembers',
  MANUAL = 'manual',
  SPECIFIC_DATE_SLOT = 'specificdateslot',
  PEOPLE_IN_GROUPS = 'peopleingroups',
}

/**
 * Enum for type of recipient selection (sendtotype)
 */
export enum SendToType {
  CUSTOM = 'custom',
  SIGNED_UP = 'signedup',
  SPECIFIC_RSVP_RESPONSE = 'specificrsvpresponse',
  SPECIFIC_DATE_SLOT = 'specificdateslot',
  PEOPLE_IN_GROUPS = 'peopleingroups',
  NOT_SIGNED_UP = 'notsignedup',
  MANUAL = 'manual',
  WAITLIST = 'waitlisted',
  ALL = 'all',
  SIGNUP_WAITLIST = 'signedupandwaitlisted',
  ALL_INCLUDE_NON_GROUP_MEMBERS = 'allincludenongroupmembers',
}

/**
 * Enum for message status values
 */
export enum MessageStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SEND = 'send',
}

/**
 * Enum for message status values
 */
export enum SignUPType {
  ACCIDEX = 'acctindex',
  PORTALS = 'portals',
  TABGROUP = 'tabgroups',
  SIGNUP = 'signup',
}

/**
 * Interface for creating a message (email/text) request
 * All fields are based on API requirements and documentation
 */
export interface ICreateMessageRequest {
  subject: string;
  body: string;
  sentto?: SentTo | string;
  sendtotype?: SendToType;
  messagetypeid: number;
  status: MessageStatus;
  sendasemail: boolean;
  sendastext: boolean;
  contactname?: string;
  replytoids?: number[];
  signuptype?: string;
  themeid?: number;
  attachmentids?: number[];
  senddate?: string;
  alias?: string;
  addEmails?: string;
  messageid?: number;
  tabgroupids?: number[];
  portals?: number[];
  signupids?: number[];
  groupids?: number[];
  slotids?: string[];
  to?: IMesssageMember[];
  sendToGroups?: Array<{ id: string; isWaitlistedRow?: boolean }>;
}

export interface IMesssageMember {
  memberid?: number;
  firstname?: string;
  lastname?: string;
  email?: string;
  isgroupemail?: boolean;
}

export interface ICreateMessageResponse {
  success: boolean;
  message: string[];
  data: number;
}

// group members with their associated groups response interfaces
export interface IAllGroupsWithMembersResponse {
  success: boolean;
  message: string[];
  data: IGroupMemberDto[];
  links: {
    self: string;
    next?: string;
    previous?: string;
  };
}

export interface IGroupMemberDto {
  member: IMemberInfoDto;
  groups: IGroupInfoDto[];
}

export interface IMemberInfoDto {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string; // Optional field
  displayname?: string;
  groups?: string;
  groupsId?: string;
}

export interface IGroupInfoDto {
  id: number;
  title: string;
}

export interface IFileItem {
  id: number;
  title?: string;
  parentid?: number;
  isfolder: boolean;
  icon?: string;
  filename?: string;
  filedescription?: string;
  filesizekb?: number;
  folderid?: number;
  fileurl?: string;
}

/**
 * File details data structure
 * Used when fetching file details from GeniusDrive
 */
export interface IFileDetailsData {
  filename: string;
  s3Presignedurl?: string;
  fileurl?: string;
  s3presignedurl?: string;
  filesizekb?: number;
  filedescription?: string;
}

/**
 * Interface for file details API response
 * Used when fetching file details from GeniusDrive
 */
export interface IFileDetailsResponse {
  success: boolean;
  message: string[];
  data: IFileDetailsData;
}

export interface IParentFolderResponse {
  success: boolean;
  message: string[];
  data: IParentFolder;
}

export interface IParentFolder {
  id: number;
  title?: string;
  isfolder: boolean;
  icon?: string;
  filename?: string;
  filedescription?: string;
  filesizekb?: number;
  folderid?: number;
  subfolder?: IFileItem[];
}

/**
 * Interface for Save Draft Message Payload
 * Extends ICreateMessageRequest with additional fields for draft messages
 */
export interface ISaveDraftMessagePayload {
  subject: string;
  body: string;
  sentto: string;
  sendtotype: string;
  messagetypeid: number;
  status: string;
  sendastext: boolean;
  sendasemail: boolean;
  replytoids?: number[];
  contactname?: string;
  themeid?: number;
  attachmentids?: number[];
  signupids?: number[];
  groupids?: number[];
  portals?: Array<{
    id: number | undefined;
    title: string | undefined;
    urlkey: string | undefined;
  }>;
  signUpType?: string;
  addEmails?: string;
  to?: Array<{
    memberid?: number;
    firstname?: string;
    lastname?: string;
    email?: string;
    isgroupemail?: boolean;
  }>;
  slotids?: string[];
  sendToGroups?: Array<{
    id: string;
    isWaitlistedRow?: boolean;
  }>;
  groups?: Array<{
    groupid: number;
    groupname: string;
  }>;
  senddate?: string;
}

/**
 * Interface for Save Draft Message Response
 */
export interface ISaveDraftMessageResponse {
  success: boolean;
  message: string[];
  data: {
    data: number; // The message ID
  };
}

/**
 * Interface for Recipients Data from fetchRecipients API
 * Properly typed version of the response data
 */
export interface IRecipientsResponseData {
  recipients: Array<{
    memberid: number;
    email: string;
    mobile?: string;
    displayname: string;
    smsoptin?: boolean;
    firstname?: string;
    lastname?: string;
  }>;
  sentto?: string;
}

/**
 * Type alias for recipient array from API response
 * Matches the structure of IRecipientsResponseData.recipients
 */
export type RecipientFromApi = {
  memberid: number;
  email: string;
  mobile?: string;
  displayname: string;
  smsoptin?: boolean;
  firstname?: string;
  lastname?: string;
};

/**
 * Interface for MessageByIdData with properly typed optional fields
 * Extends MessageByIdData with additional typed fields
 */
export interface IMessageByIdDataExtended extends MessageByIdData {
  to?: Array<{
    memberid: number;
    firstname: string;
    lastname: string;
    email: string;
    isgroupemail?: boolean;
  }>;
}
export interface IShortUrlResponse {
  success: boolean;
  message: string[];
  data: {
    url: string;
  };
}

/**
 * Set of recipient values that should be excluded from message preview and send payloads.
 * These values represent UI-only selection options that don't map to actual recipient data.
 */
export const EXCLUDED_RECIPIENT_VALUES = new Set<string>([
  'manual_entry',
  'sendMessagePeopleIselect',
  'peopleOnWaitlist',
  'peopleSignedUpAndWaitlist',
  'peopleWhoSignedUp',
  'peopleWhoNotSignedUp',
]);
