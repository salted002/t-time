// GET /templates (API 45)
export interface SmsTemplate {
  id: string
  name: string
  content: string
  contentPreview: string
  isDefault: boolean
}
