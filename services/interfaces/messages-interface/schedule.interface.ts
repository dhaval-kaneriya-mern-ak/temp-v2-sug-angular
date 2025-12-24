import { Timezone, CreatedBy } from './common.interface';

export interface Message {
  messageid: number;
  memberid: number;
  subject: string;
  body: string;
  datecreated: string;
  messagetype: string;
  messagetypeid: number;
  senddate: string;
  timezone: Timezone;
  status?: string;
  createdby: CreatedBy;
  action?: string;
}

export interface MessageData {
  totalcount: number;
  messages: Message[];
}

export interface MessageApiResponse {
  success: boolean;
  message: string[];
  data: MessageData;
}
