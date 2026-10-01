import { format } from 'date-fns'
import { tz } from '@date-fns/tz'

// DATE 문자열은 시간대 이동을 피하려고 Date를 거치지 않고 문자열만 변환한다.

// '2025-09-01' → '25.09.01'
export function formatShortDate(dateString: string): string {
  return dateString.slice(2).replaceAll('-', '.')
}

// '2025-09-01' → '2025.09.01'
export function formatDate(dateString: string): string {
  return dateString.replaceAll('-', '.')
}

// ISO 시각(UTC) → 서울 시간 기준 'yy.MM.dd'
export function formatCreatedDate(isoString: string): string {
  return format(new Date(isoString), 'yy.MM.dd', { in: tz('Asia/Seoul') })
}

// 최신순 목록의 일련번호. 전체 개수 − ((page − 1) × size + index), 세 자리 0 패딩.
export function formatSerial(count: number, page: number, size: number, index: number): string {
  const serial = count - ((page - 1) * size + index)
  return String(serial).padStart(3, '0')
}

// null → '-', 정수 → '18', 소수 → '18.5'
export function formatScore(value: number | null): string {
  if (value === null) return '-'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
