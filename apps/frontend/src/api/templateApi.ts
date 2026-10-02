import { api } from '@/lib/api'
import type { SmsTemplate, TemplateFormValues } from '@/types/template'

export const templateApi = {
  // GET /templates (API 45)
  list: (signal: AbortSignal): Promise<SmsTemplate[]> =>
    api.get<{ templates: SmsTemplate[] }>('/templates', { signal }).then((r) => r.data.templates),

  // POST /templates (API 46)
  create: (values: TemplateFormValues) => api.post('/templates', values),

  // PATCH /templates/:templateId (API 48)
  update: (templateId: string, values: TemplateFormValues) =>
    api.patch(`/templates/${templateId}`, values),

  // DELETE /templates/:templateId (API 49)
  remove: (templateId: string) => api.delete(`/templates/${templateId}`),
}
