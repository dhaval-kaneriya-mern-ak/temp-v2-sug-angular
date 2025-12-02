import { Timezone, CreatedBy } from './common.interface';

export interface SentMessagesResponse {
  success: boolean;
  message: unknown[];
  data: SentMessagesData;
}

export interface SentMessagesData {
  totalcount: number;
  messages: SentMessage[];
}

export interface SentMessage {
  messageid?: number;
  sentdate?: number;
  messagetype?: string;
  status?: string;
  subject?: string;
  timezone?: Timezone;
  totalsent?: number;
  createdby?: CreatedBy;
}

// Interface for table display data
export interface SentMessageTableData {
  messageid: number;
  sent: string;
  subject: string;
  sentTo: string;
  status: string;
  action: string;
  originalData: SentMessage;
}

// Interface for message details API response
export interface MessageDetailsResponse {
  success: boolean;
  message: unknown[];
  data: MessageDetailsData;
}

export interface MessageDetailsData {
  messageid: number;
  messagetype: string;
  sentdate: string;
  status: string;
  subject: string;
  contactname: string;
  title: string;
  body: string;
  preview: string;
  timezone: Timezone;
  createdby: CreatedBy;
  totalsent: number;
  signups: MessageSignup[];
  themes: MessageTheme[];
}

export interface MessageSignup {
  id: number;
  title: string;
}

export interface MessageTheme {
  id: number;
  name: string;
}

// Interface for message stats API response
export interface MessageStatsResponse {
  success: boolean;
  message: unknown[];
  data: MessageStatsData;
}

export interface MessageStatsData {
  deliverystats: DeliveryStats;
  responsestats: ResponseStats;
  sentdetails: SentDetails[];
}

export interface SentDetails {
  email: string;
  mobile: string;
  units: number;
  memberevents: string;
  memberid: number;
  signedup: string;
  issues: string;
  opened: string;
  clicked: string;
}
export interface DeliveryStats {
  totalsent: number;
  delivered: number;
  bounced: number;
  dropped: number;
  spam: number;
}

export interface ResponseStats {
  delivered: number;
  opened: number;
  uniqueclicks: number;
  signedup: number;
}

// Chart configuration constants
export const CHART_COLORS = {
  DELIVERED: '#acc034',
  BOUNCED: '#fff590',
  DROPPED: '#f68b1c',
  SPAM: '#ca3c3b',
} as const;

export const PERCENTAGE_THRESHOLDS = {
  WARNING: 20,
} as const;

export const LABEL_RADIUS_MULTIPLIER = 0.6;

export const CHART_LABELS = [
  'Delivered',
  'Bounced',
  'Dropped',
  'Spam',
] as const;
