// GET /reports (API 30)
export type ShareLinkStatus = '없음' | '유효' | '만료됨'

export interface ReportSummary {
  id: string
  studentId: string
  studentName: string
  subjectCount: number
  createdAt: string // ISO 8601
  shareLinkStatus: ShareLinkStatus
  shareLinkExpiresAt: string | null // ISO 8601
}

export interface ReportListResponse {
  reports: ReportSummary[]
  count: number
  page: number
  size: number
}

// POST /reports/subject-options (API 33)
export interface SubjectOptionsResponse {
  subjectNames: string[]
}

// POST /reports/batch-preview (API 34)
export interface BatchCandidate {
  studentId: string
  studentName: string
  availableSubjects: string[]
  generatable: boolean
}

export interface BatchPreviewResponse {
  candidates: BatchCandidate[]
  generatableCount: number
}

// POST /reports/preview (API 27) — 일괄 흐름
export interface SubjectStat {
  recent10: { examId: string; examDate: string; score: number | null }[]
  classAverageRecent10: { examId: string; examDate: string; average: number | null }[]
}

export interface ReportPreview {
  studentId: string
  studentName: string
  className: string | null
  subjectNames: string[]
  examIds: string[]
  subjectStats: Record<string, SubjectStat>
  aiSubjectFeedback: Record<string, string> | null // 미구독이면 null
  aiOverallFeedback: string | null // 참고용. 저장·발송되지 않는다.
  subscribed: boolean
  linkExpiresAt: string // ISO 8601, "지금 저장하면" 만료될 예정 시각
}

// POST /reports/bulk (API 35)
export interface BulkReportItem {
  studentId: string
  examIds: string[]
  subjectNames: string[]
  teacherFeedback?: string
  aiFeedback: Record<string, string> | null
}

export interface SavedReport {
  id: string
  studentId: string
  studentName: string
  parentPhone: string
  shareLink: { url: string; expiresAt: string }
}
