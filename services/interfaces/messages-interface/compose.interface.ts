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
