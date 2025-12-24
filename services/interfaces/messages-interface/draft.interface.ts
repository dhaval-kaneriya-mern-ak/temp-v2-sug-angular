// Interface for draft messages API response
export interface DraftMessagesResponse {
  success: boolean;
  message: string[];
  data: {
    messages: DraftMessage[];
    totalcount: number;
  };
}

export interface DraftMessage {
  messageid: number;
  memberid: number;
  messagetypeid: number;
  subject: string;
  body: string;
  messagetype: string;
  datecreated: string;
  status?: string;
  action?: string;
}

export interface selectedDraft {
  messageid: number;
  messagetypeid: number;
  messagetype: string;
  subject: string;
  datecreated: string;
  status?: string;
  action?: string;
}
