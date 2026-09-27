import type { StudentStatus } from '@/types/student'

export type Tone = 'success' | 'warning' | 'destructive' | 'info' | 'muted'

export const STUDENT_STATUS_TONE = {
  재원: 'success',
  휴원: 'warning',
  퇴원: 'muted',
} as const satisfies Record<StudentStatus, Tone>

// TODO: 운영자 문의 메일 주소 확정되면 교체
export const SUPPORT_EMAIL = 'support@t-time.kr'
