import { api } from '@/lib/api'
import type { ExamDetail, ExamDetailResponse, ExamListResponse } from '@/types/exam'

interface ExamListParams {
  q: string
  page: number
  size: number
}

export const examApi = {
  // GET /exams (API 19)
  list: (params: ExamListParams, signal: AbortSignal) =>
    api
      .get<ExamListResponse>('/exams', {
        params: { page: params.page, size: params.size, ...(params.q && { q: params.q }) },
        signal,
      })
      .then((response) => response.data),

  // GET /exams/:examId (API 21)
  get: (examId: string, signal: AbortSignal): Promise<ExamDetail> =>
    api
      .get<ExamDetailResponse>(`/exams/${examId}`, { signal })
      .then((response) => response.data.exam),

  // DELETE /exams/:examId (API 25)
  remove: (examId: string): Promise<void> => api.delete(`/exams/${examId}`).then(() => undefined),
}
