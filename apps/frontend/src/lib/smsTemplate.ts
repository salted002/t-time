import type { SmsDraft } from '@/types/reportSend'
import type { SmsTemplate } from '@/types/template'
import { MOBILE_REGEX, onlyDigits } from './phone'

export const SMS_SHORT_BYTES = 90
export const SMS_MAX_BYTES = 2000

const STUDENT_NAME_TOKEN = '{학생명}'

export function renderSmsTemplate(content: string, studentName: string) {
  return content.split(STUDENT_NAME_TOKEN).join(studentName)
}

// 한글 2바이트, 그 외 1바이트 (CoolSMS 기준)
export function getSmsBytes(message: string, link: string) {
  const text = `${message}\n${link}`
  let bytes = 0
  for (const char of text) bytes += (char.codePointAt(0) ?? 0) > 0x7f ? 2 : 1
  return bytes
}

export function isValidSmsPhone(phone: string) {
  return MOBILE_REGEX.test(onlyDigits(phone))
}

export function isValidSmsMessage(message: string, link: string) {
  return message.trim().length > 0 && getSmsBytes(message.trim(), link) <= SMS_MAX_BYTES
}

// 기본 템플릿이 있으면 그 본문으로, 없으면 빈 메시지로 시작한다.
export function getDefaultDraft(templates: SmsTemplate[], studentName: string): SmsDraft {
  const template = templates.find((item) => item.isDefault)
  return template
    ? { templateId: template.id, message: renderSmsTemplate(template.content, studentName) }
    : { templateId: null, message: '' }
}
