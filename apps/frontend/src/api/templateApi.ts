import { api } from '@/lib/api'
import type { SmsTemplate } from '@/types/template'

export const templateApi = {
  // GET /templates (API 45)
  list: (signal: AbortSignal): Promise<SmsTemplate[]> =>
    api.get<{ templates: SmsTemplate[] }>('/templates', { signal }).then((r) => r.data.templates),
}
