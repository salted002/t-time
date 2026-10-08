export const onlyDigits = (v: string) => v.replace(/\D/g, '')

export const MOBILE_REGEX = /^01[016789]\d{7,8}$/
export const PHONE_REGEX = /^0\d{8,10}$/

export function formatPhone(v: string | null | undefined) {
  const raw = onlyDigits(v ?? '')
  const p = raw.startsWith('02') ? 2 : 3 // 서울(02)만 앞자리가 2자리
  const d = raw.slice(0, p === 2 ? 10 : 11)
  if (d.length <= p) return d
  const rest = d.slice(p)
  if (rest.length <= 4) return `${d.slice(0, p)}-${rest}`
  return `${d.slice(0, p)}-${rest.slice(0, -4)}-${rest.slice(-4)}`
}
