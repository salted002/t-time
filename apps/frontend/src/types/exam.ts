// 시험 목록 한 줄 (GET /exams, API 명세서 19번)
export interface ExamSummary {
  id: string
  examDate: string // 'YYYY-MM-DD'
  name: string
  className: string | null // 반이 삭제되면 null
  participantCount: number
  createdAt: string // ISO 8601
}

export interface ExamListResponse {
  exams: ExamSummary[]
  count: number
  page: number
  size: number
}

// 평가방식: 점수형 / 점수(만점)형 / 등급형
export type EvalType = 'score' | 'score_max' | 'grade'

export interface ExamSubject {
  id: string
  name: string
  maxScore: number | null // score_max일 때만 값 존재
}

export interface ExamGrade {
  id: string
  label: string
  order: number // 작을수록 높은 등급
}

export interface ExamScoreCell {
  subjectId: string
  score: number | null // 미입력은 null (0점과 구분)
  gradeId: string | null
}

export interface ExamParticipantResult {
  participantId: string
  studentId: string | null // 학생 레코드가 삭제되면 null
  studentName: string
  scores: ExamScoreCell[]
  total: number | null
  average: number | null
  totalRank: string | null // '2/24'
  subjectRanks: { subjectId: string; rank: string | null }[]
  teacherComment: string | null
}

// 시험 상세 (GET /exams/:examId, API 명세서 21번)
export interface ExamDetail {
  id: string
  examDate: string
  classId: string | null
  className: string | null
  name: string
  evalType: EvalType
  memo: string | null
  subjects: ExamSubject[]
  grades: ExamGrade[] // 등급형일 때만
  participants: ExamParticipantResult[]
  excludedStudents: { studentId: string; name: string }[]
  classAverage: {
    bySubject: { subjectId: string; average: number | null }[]
    total: number | null
  } | null // 등급형이면 null
  subjectTrend:
    | { subjectId: string; history: { examId: string; examDate: string; classAverage: number }[] }[]
    | null // 등급형이면 null
  gradeDistribution:
    | { subjectId: string; distribution: { gradeId: string; label: string; count: number }[] }[]
    | null // 점수형이면 null
}

// 응답 본문은 { success, exam, message }
export interface ExamDetailResponse {
  exam: ExamDetail
}
