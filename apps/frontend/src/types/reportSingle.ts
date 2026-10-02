import type { ReportPreview, SubjectStat } from '@/types/report'

// POST /reports/preview (API 27) — 단일 흐름(examId 전달)에서만 채워지는 필드
export interface ResultsTableRow {
  subjectName: string
  score: number | null
  gradeLabel: string | null
  maxScore: number | null
  classAverage: number | null
  subjectRank: string | null // '2/24'
}

export interface ResultsTable {
  rows: ResultsTableRow[]
  total: {
    score: number | null
    maxScoreTotal: number | null
    classAverage: number | null
    rank: string | null
  }
}

export interface SingleSubjectStat extends SubjectStat {
  personalVsExamAverage: {
    score: number | null
    examAverage: number | null
    subjectRank: string | null
  } | null
}

export type SingleReportPreview = Omit<ReportPreview, 'subjectStats'> & {
  examId: string
  resultsTable: ResultsTable
  subjectStats: Record<string, SingleSubjectStat>
}

// POST /reports (API 28)
export interface SingleReportPayload {
  studentId: string
  examId: string
  examIds: string[]
  subjectNames: string[]
  teacherFeedback?: string
  aiFeedback: Record<string, string> | null
}

// POST /reports/:reportId/share-link (API 29)
export interface ShareLink {
  url: string
  expiresAt: string // ISO 8601
}
