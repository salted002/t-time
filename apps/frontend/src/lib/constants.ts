import type { EvalType } from '@/types/exam'
import type { StudentStatus } from '@/types/student'

export type Tone = 'success' | 'warning' | 'destructive' | 'info' | 'muted'

export const STUDENT_STATUS_TONE = {
  재원: 'success',
  휴원: 'warning',
  퇴원: 'muted',
} as const satisfies Record<StudentStatus, Tone>

export const SUPPORT_EMAIL = '001salted@gmail.com'

export const GITHUB_URL = 'https://github.com/salted002/t-time'

export const EVAL_TYPE_LABEL = {
  score: '점수형',
  score_max: '점수(만점)형',
  grade: '등급형',
} as const satisfies Record<EvalType, string>

// 데모 계정 (시더 0001-demo-academy.js의 계정과 같아야 한다)
export const DEMO_ACCOUNT = {
  email: 'admin@tomato.kr',
  password: 'Ttime1234!',
} as const
