import { api } from '@/lib/api'
import type { ExamDetail, ExamDetailResponse, ExamListResponse } from '@/types/exam'
import type { ExamCopyPayload, ExamCreated, ExamCreatePayload, ExamUpdatePayload } from '@/types/examForm'
import type { ExamResultsPayload } from '@/types/examResultForm'

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

  // POST /exams (API 20)
  create: (payload: ExamCreatePayload): Promise<ExamCreated> =>
    api.post<{ exam: ExamCreated }>('/exams', payload).then((response) => response.data.exam),

  // PATCH /exams/:examId (API 22)
  update: (examId: string, payload: ExamUpdatePayload): Promise<void> =>
    api.patch(`/exams/${examId}`, payload).then(() => undefined),

  // PUT /exams/:examId/results (API 23)
  saveResults: (examId: string, payload: ExamResultsPayload): Promise<void> =>
    api.put(`/exams/${examId}/results`, payload).then(() => undefined),

  // POST /exams/:examId/copy (API 26)
  copy: (examId: string, payload: ExamCopyPayload): Promise<ExamCreated> =>
    api
      .post<{ exam: ExamCreated }>(`/exams/${examId}/copy`, payload)
      .then((response) => response.data.exam),

  // DELETE /exams/:examId (API 25)
  remove: (examId: string): Promise<void> => api.delete(`/exams/${examId}`).then(() => undefined),
}
