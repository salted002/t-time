import { z } from 'zod'

export const TEMPLATE_NAME_MAX = 50
// 본문 + 링크가 SMS 최대 2000바이트(한글 2바이트)를 넘지 않도록 잡은 값
export const TEMPLATE_CONTENT_MAX = 900

// GET /templates (API 45)
export interface SmsTemplate {
  id: string
  name: string
  content: string
  contentPreview: string
  isDefault: boolean
}

export const templateFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '템플릿명을 입력해 주세요.')
    .max(TEMPLATE_NAME_MAX, `템플릿명은 ${TEMPLATE_NAME_MAX}자 이내로 입력해 주세요.`),
  content: z
    .string()
    .trim()
    .min(1, '본문을 입력해 주세요.')
    .max(TEMPLATE_CONTENT_MAX, `본문은 ${TEMPLATE_CONTENT_MAX}자 이내로 입력해 주세요.`),
  isDefault: z.boolean(),
})

export type TemplateFormValues = z.infer<typeof templateFormSchema>
