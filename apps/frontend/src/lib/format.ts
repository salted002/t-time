import { tz } from '@date-fns/tz'
import { format } from 'date-fns'

// 'YYYY-MM-DD' ⇒ 'yy.MM.dd'
// 예: 2025-09-01 → 25.09.01
export function formatShortDate(dateString: string): string {
  return dateString.slice(2).replaceAll('-', '.')
}

// ISO 시각 문자열 ⇒ 한국 시간 기준 'yy.MM.dd'
// '2025-08-27T16:00:00.000Z' → '25.08.28'
export function formatCreatedDate(isoString: string): string {
  return format(new Date(isoString), 'yy.MM.dd', { in: tz('Asia/Seoul') })
}

// 목록의 일련번호 계산 (최신순, "현재 개수" 개념)
export function formatSerial(count: number, page: number, size: number, index: number): string {
  const serial = count - ((page - 1) * size + index)
  return String(serial).padStart(3, '0')
}
