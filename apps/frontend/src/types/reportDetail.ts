import type { SubjectStat } from '@/types/report'

// GET /reports/:reportId (API 31)
export interface ReportDetail {
  id: string
  studentId: string
  studentName: string
  className: string | null
  subjectNames: string[]
  examIds: string[]
  subjectStats: Record<string, Pick<SubjectStat, 'recent10' | 'classAverageRecent10'>>
  teacherFeedback: string | null
  aiFeedback: Record<string, string> | null // 미구독이면 null
  subscribed: boolean
  shareLink: { url: string; expiresAt: string; expired: boolean } | null
  createdAt: string // ISO 8601
}
