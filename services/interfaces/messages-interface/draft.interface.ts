// Interface for draft messages API response
export interface DraftMessagesResponse {
  success: boolean;
  message: unknown[];
  data: DraftMessage[];
}

export interface DraftMessage {
  messageid: number;
  subject: string;
  messagetypeid: number;
  messagetype: string;
  created: string;
}
