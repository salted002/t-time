import { api } from '@/lib/api'
import type {
  StudentExamListResponse,
  StudentExamResult,
  StudentExamResultResponse,
} from '@/types/studentExam'

interface StudentExamListParams {
  page: number
  size: number
}

export const studentExamApi = {
  // GET /students/:studentId/exam-results (API 12)
  list: (studentId: string, params: StudentExamListParams, signal: AbortSignal) =>
    api
      .get<StudentExamListResponse>(`/students/${studentId}/exam-results`, { params, signal })
      .then((response) => response.data),

  // GET /students/:studentId/exam-results/:examId (API 13)
  get: (studentId: string, examId: string, signal: AbortSignal): Promise<StudentExamResult> =>
    api
      .get<StudentExamResultResponse>(`/students/${studentId}/exam-results/${examId}`, { signal })
      .then((response) => response.data.examResult),

  // PATCH /exams/:examId/participants/:participantId (API 24)
  updateComment: (
    examId: string,
    participantId: string,
    teacherComment: string | null,
  ): Promise<void> =>
    api
      .patch(`/exams/${examId}/participants/${participantId}`, { teacherComment })
      .then(() => undefined),
}
