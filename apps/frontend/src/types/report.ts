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
