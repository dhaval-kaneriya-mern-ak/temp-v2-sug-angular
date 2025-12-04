import { Organization } from './organization.interface';

/**
 * Member profile interface
 */
export interface MemberProfile {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  ispro: boolean;
  istrial: boolean;
  eligiblefortrial: boolean;
  isadmin: boolean;
  organization: Organization | Record<string, never>;
  profilepicture: ProfilePicture;
  issubadmin: boolean;
  hasMemberOptIns?: boolean;
  zonename: string;
  mobile: string;
  subscription: Subscription;
  features: Features;
  selecteddateformat: DateFormat;
}

/**
 * Subscription interface
 */
export interface Subscription {
  productcode: string;
  productname: string;
  expiration: string;
}

/**
 * Features interface
 */
export interface Features {
  customquestions: number;
  hiddenfields: number;
  multiadmins: number;
  multinotify: number;
  startclosesignup: number;
  customimages: number;
  hidepastdates: number;
  lockdays: number;
  geniusdrivesizemb: number;
  limitquantity: number;
  noads: number;
  phonesupport: number;
  backtowebsite: boolean;
  calendarsync: boolean;
  prothemebuilder: number;
  messagerecipientautoapprove: number;
  messagerecipientpersend: number;
  messagerecipientperday: number;
  messagerecipientpermonth: number;
  customconfirmations: number;
  customreminders: number;
  textmessagelimit: number;
  wepay_rate: PaymentRate[];
  noadslicenses: number;
  customurl: boolean;
  removebranding: boolean;
  themeoverride: string;
  locationsearch: boolean;
  portalpages: boolean;
  productimages: boolean;
  participanttier: number;
  embeddedsignups: boolean;
  embedportalpages: boolean;
  embeddedportalpages: boolean;
  nonprofiteasy: boolean;
  managecreatedsignups: boolean;
  lumapay_rate: PaymentRate[];
  signupprotection: boolean;
  signuptabbing: boolean;
  supqrcodes: boolean;
  ssoauth: boolean;
  hidenumberwanted: boolean;
  globalcustomcontact: boolean;
  waitlist: boolean;
  rcegroups: number;
}

/**
 * Payment rate interface
 */
export interface PaymentRate {
  fee_payer: string;
  pertransactionfee: string;
  percentfee: string;
  active: boolean;
  minimumamount: string;
  date: string;
}

/**
 * Date format interface
 */
export interface DateFormat {
  id: number;
  name: string;
  short: string;
  medium: string;
  long: string;
}

/**
 * User profile picture interface
 */
export interface ProfilePicture {
  type: string;
  small: string;
  medium: string;
  large: string;
  xlarge: string;
  text: string;
}

/**
 * User role interface (for backward compatibility)
 */
export interface UserRole {
  id: string;
  name: string;
  permissions?: string[];
}

/**
 * Phone type for user update
 */
export type PhoneType = 'home' | 'work' | 'mobile';

/**
 * Phone object for user update payload
 */
export interface IUpdateUserPhone {
  type: PhoneType;
  value: string;
  preferred: boolean;
  carrierid?: number;
}

/**
 * Address object for user update payload
 */
export interface IUpdateUserAddress {
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalcode?: string;
  countryid?: number;
}

/**
 * Organization object for user update payload
 */
export interface IUpdateUserOrganization {
  name?: string;
  title?: string;
  orgsizeid?: number;
  orgtypeid?: number;
  orgsubtypeid?: number;
}

/**
 * Profile picture object for user update payload
 */
export interface IUpdateUserProfilePicture {
  type?: string;
  value?: string;
}

/**
 * User update API payload interface
 */
export interface IUpdateUserPayload {
  firstname: string;
  lastname: string;
  email: string;
  address?: IUpdateUserAddress;
  phone?: IUpdateUserPhone[];
  organization?: IUpdateUserOrganization;
  profilepicture?: IUpdateUserProfilePicture;
  emaildomainid?: number;
}

/**
 * User update API response interface
 */
export interface IUpdateUserApiResponse {
  success: boolean;
  message: string[];
  data: boolean;
}
