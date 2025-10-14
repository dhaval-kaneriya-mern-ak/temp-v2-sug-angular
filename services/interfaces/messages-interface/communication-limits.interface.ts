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

export interface MessageTimezone {
  id: number;
  zone: string;
}

export interface MessageCreatedBy {
  memberid: number;
  email: string;
}

export interface MessageItem {
  messageid?: number;
  sentdate?: string;
  messagetype?: string;
  status?: string;
  subject?: string;
  sentTo?: string;
  chart?: string;
  timezone?: MessageTimezone;
  createdby?: MessageCreatedBy;
  totalsent?: number;
}

export type MessagesListResponse = MessageItem[];
