export type MessageLogStatus = '성공' | '실패';

export interface MessageLogSummary {
  id: string;
  sentAt: string;
  studentName: string;
  recipientPhone: string;
  messagePreview: string;
  status: MessageLogStatus;
}

export interface MessageLogListResponse {
  messageLogs: MessageLogSummary[];
  count: number;
}

export interface MessageLogDetail extends Omit<MessageLogSummary, 'messagePreview'> {
  message: string;
  /** '/share/{token}' 상대경로, 링크 없이 보낸 문자면 null */
  sentLink: string | null;
  linkExpired: boolean | null;
  linkedReport: { reportId: string; studentName: string | null } | null;
}
