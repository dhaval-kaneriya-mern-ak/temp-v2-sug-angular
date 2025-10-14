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
  zonename: string;
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
