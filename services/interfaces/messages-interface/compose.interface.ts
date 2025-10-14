/**
 * Interface for member verification details data
 */
export interface MemberVerificationData {
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
export interface MemberVerificationDetailsResponse {
  MESSAGE: string[];
  DATA: MemberVerificationData;
  SUCCESS: boolean;
  CODE: string;
}

/**
 * Interface for member email limits data
 */
export interface MemberEmailLimitsData {
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
export interface MemberEmailLimitsResponse {
  MESSAGE: string;
  DATA: MemberEmailLimitsData;
  SUCCESS: boolean;
  CODE: string;
}

/**
 * Interface for SignUp item data
 */
export interface SignUpItem {
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
  ID: number;
  NODATE: number;
  SENDCONFIRMATIONS: string | number;
  CONFIRMATIONTEMPLATE: string | number;
  BACKGROUNDCOLOR: string;
  TITLE: string;
}

/**
 * Interface for the complete API response from getSignUpList
 * API Endpoint: https://test.signupgenius.rocks/SUGboxAPI.cfm?go=s.getSignUpList
 */
export interface SignUpListResponse {
  MESSAGE: string;
  DATA: SignUpItem[];
  SUCCESS: boolean;
  CODE: string;
}

/**
 * Interface for group/community data
 */
export interface GroupItem {
  MEMBERCOUNT: number;
  COMMUNITY: string;
  ID: number;
}

/**
 * Interface for the complete API response from getGroupforMembers
 * API Endpoint: https://test.signupgenius.rocks/SUGboxAPI.cfm?go=m.getGroupforMembers
 */
export interface GroupListResponse {
  MESSAGE: string;
  DATA: GroupItem[];
  SUCCESS: boolean;
  CODE: string;
}

/**
 * Interface for group member data
 */
export interface GroupMember {
  LASTNAME: string;
  GROUPID: number;
  ID: number;
  FIRSTNAME: string;
  ISCHECKED: boolean;
  GROUP: string;
  EMAIL: string;
}

/**
 * Interface for the complete API response from getGroupMembers
 * API Endpoint: https://test.signupgenius.rocks/SUGboxAPI.cfm?go=t.getGroupMembers
 */
export interface GroupMembersResponse {
  MESSAGE: string;
  DATA: GroupMember[];
  SUCCESS: boolean;
  CODE: string;
}

/**
 * Interface for the complete API response from getCloudSpongeServices
 * API Endpoint: https://test.signupgenius.rocks/SUGboxAPI.cfm?go=t.getCloudSpongeServices
 */
export interface CloudSpongeServicesResponse {
  MESSAGE: string[];
  DATA: string;
  SUCCESS: boolean;
  CODE: string;
}

/**
 * Interface for sub-admin data
 */
export interface SubAdmin {
  NAME: string;
  ID: number;
  ISCHECKED: boolean;
  EMAIL: string;
}

/**
 * Interface for the complete API response from getSubAdmins
 * API Endpoint: https://test.signupgenius.rocks/SUGboxAPI.cfm?go=t.getSubAdmins
 */
export interface SubAdminsResponse {
  MESSAGE: string[];
  DATA: SubAdmin[];
  SUCCESS: boolean;
  CODE: string;
}

/**
 * Interface for member creation history
 */
export interface CreationHistory {
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
export interface MemberContact {
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
export interface NoAdsLicense {
  totallicenses: number;
  signupids: number[];
  unusedLicenses: number;
}

/**
 * Interface for member features
 */
export interface MemberFeatures {
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
export interface MemberDateFormatOption {
  selected: boolean;
  format: string;
}

/**
 * Interface for timezone information
 */
export interface MemberTimezone {
  timezoneid: number;
  tzshort: string;
  timezone: string;
}

/**
 * Interface for date and timezone settings
 */
export interface DateTzSettings {
  dateformats: MemberDateFormatOption[];
  timezone: MemberTimezone;
}

/**
 * Interface for signup setting option
 */
export interface SignupSettingOption {
  FORCE: boolean;
  VALUE: string | boolean;
}

/**
 * Interface for signup settings
 */
export interface SignupSettings {
  reminddays: SignupSettingOption;
  removeBranding: SignupSettingOption;
  reminders: SignupSettingOption;
  newWizard: SignupSettingOption;
  globalCustomContact: SignupSettingOption;
  socialshare: SignupSettingOption;
  showProfilePics: SignupSettingOption;
  calendarView: SignupSettingOption;
  noGroupAdd: SignupSettingOption;
  allowswap: SignupSettingOption;
  notifyme: SignupSettingOption;
}

/**
 * Interface for member info data
 */
export interface MemberInfoData {
  creationhistory: CreationHistory;
  isAdmin: boolean;
  mobile: string;
  parentID: number;
  hasPayments: boolean;
  membercontact: MemberContact;
  noadslicense: NoAdsLicense;
  firstName: string;
  features: MemberFeatures;
  datetzsettings: DateTzSettings;
  isEligibleForTrial: boolean;
  productCode: string;
  previoussubscriber: boolean;
  email: string;
  hasMemberOptIns: boolean;
  signupsettings: SignupSettings;
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
export interface MemberInfoResponse {
  MESSAGE: string;
  DATA: MemberInfoData;
  SUCCESS: boolean;
  CODE: string;
}

/**
 * Interface for SignUp data from getSignUpList API
 */
export interface SignUpData {
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
  ID: number;
  NODATE: number;
  SENDCONFIRMATIONS: string | number;
  CONFIRMATIONTEMPLATE: string | number;
  BACKGROUNDCOLOR: string;
  TITLE: string;
}

/**
 * Interface for the complete API response from getSignUpList
 * API Endpoint: https://test.signupgenius.rocks/SUGboxAPI.cfm?go=s.getSignUpList
 */
export interface GetSignUpListResponse {
  MESSAGE: string;
  DATA: SignUpData[];
  SUCCESS: boolean;
  CODE: string;
}
