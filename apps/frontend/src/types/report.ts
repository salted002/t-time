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
