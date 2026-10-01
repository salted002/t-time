import { api } from '@/lib/api'
import type { SendItem, SendResponse } from '@/types/reportSend'

export const reportSendApi = {
  // POST /reports/send (API 36) — items가 1개면 단일 발송
  send: (items: SendItem[]): Promise<SendResponse> =>
    api.post<SendResponse>('/reports/send', { items }).then((response) => response.data),
}
