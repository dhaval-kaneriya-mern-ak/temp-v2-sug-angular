import { Timezone, CreatedBy } from './common.interface';

export interface Message {
  messageid: number;
  memberid: number;
  subject: string;
  body: string;
  datecreated: number;
  messagetype: string;
  messagetypeid: number;
  senddate: number;
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
