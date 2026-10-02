import { api } from '@/lib/api';
import type { MessageLogDetail, MessageLogListResponse } from '@/types/messageLog';

export const messageLogApi = {
  // GET /message-logs (발송일시 내림차순)
  list: (params: { page: number; size: number }, signal: AbortSignal): Promise<MessageLogListResponse> =>
    api.get<MessageLogListResponse>('/message-logs', { params, signal }).then((response) => response.data),

  // GET /message-logs/:logId
  get: (logId: string, signal: AbortSignal): Promise<MessageLogDetail> =>
    api
      .get<{ messageLog: MessageLogDetail }>(`/message-logs/${logId}`, { signal })
      .then((response) => response.data.messageLog),
};
