import type { EvalType, ExamGrade } from '@/types/exam'

// GET /students/:studentId/exam-results (API 12)
export interface StudentExamSummary {
  examId: string
  examDate: string // 'YYYY-MM-DD'
  className: string | null // 반이 삭제되면 null
  examName: string
  subjectCount: number
  evalType: EvalType
  memo: string | null
}

export interface StudentExamListResponse {
  examResults: StudentExamSummary[]
  count: number
  page: number
  size: number
}

// GET /students/:studentId/exam-results/:examId (API 13)
export interface StudentExamResult {
  examInfo: {
    examDate: string
    className: string | null
    examName: string
    evalType: EvalType
    memo: string | null
    subjectCount: number
    grades: ExamGrade[]
  }
  participantId: string
  subjects: { subjectId: string; name: string; maxScore: number | null }[]
  results: {
    subjectId: string
    score: number | null
    gradeLabel: string | null
    classAverage: number | null
    subjectRank: string | null // '2/24'
  }[]
  total: {
    score: number | null
    maxScoreTotal: number | null
    classAverage: number | null
    rank: string | null
  }
  teacherComment: string | null
  subjectComparison:
    | { subjectId: string; personalScore: number | null; examAverage: number | null }[]
    | null
  recentTrend:
    | {
        subjectId: string
        history: { examId: string; examDate: string; score: number | null }[]
      }[]
    | null
  gradeDistribution:
    | {
        subjectId: string
        distribution: { gradeId: string; label: string; count: number }[]
      }[]
    | null
}

export interface StudentExamResultResponse {
  examResult: StudentExamResult
}
