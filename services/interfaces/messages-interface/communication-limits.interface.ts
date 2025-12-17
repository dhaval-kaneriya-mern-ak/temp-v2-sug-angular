import { Timezone, CreatedBy } from './common.interface';

export interface MessageLimitsResponse {
  sentemailtoday: number;
  sentemailforthemonth: number;
  monthlylimit: number;
  dailylimit: number;
  startdate: number;
  enddate: number;
  textmessagelimit: number;
  senttextforthemonth: number;
  senttexttoday: number;
}

export interface MessageItem {
  messageid?: number;
  sentdate?: string;
  messagetype?: string;
  status?: string;
  subject?: string;
  sentTo?: string;
  chart?: string;
  timezone?: Timezone;
  createdby?: CreatedBy;
  totalsent?: number;
}

export type MessagesListResponse = MessageItem[];

export interface IMessageDeliveryStats {
  id: number;
  name: string;
  ct: number;
  badgestyle: string;
  badgecolor: string;
}
