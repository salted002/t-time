import type { SubjectStat } from '@/types/report'

// GET /share/:token (API 37) — 학부모용 공개 리포트
export interface SharedReport {
  academyName: string
  academyLogoUrl: string | null
  studentName: string
  subjectNames: string[]
  subjectStats: Record<string, Pick<SubjectStat, 'recent10' | 'classAverageRecent10'>>
  teacherFeedback: string | null
  aiFeedback: Record<string, string> | null // 미구독 학원이면 null
  expiresAt: string
}

export type SharedReportResult =
  | { ok: true; report: SharedReport }
  | { ok: false; reason: 'invalid' | 'expired' }
