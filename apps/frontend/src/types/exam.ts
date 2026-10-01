// 시험 목록의 행에서 보여줄 정보 (GET /exams 응답의 exams 배열 원소)
export interface ExamSummary {
  id: string
  examDate: string
  name: string
  className: string | null
  participantCount: number
  createdAt: string
}

// GET /exams 응답 전체의 모양
export interface ExamListResponse {
  exams: ExamSummary[]
  count: number
  page: number
  size: number
}
