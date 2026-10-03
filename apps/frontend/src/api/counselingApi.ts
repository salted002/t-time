import { api } from '@/lib/api'
import type { CounselingListResponse, CounselingPayload } from '@/types/counseling'

interface CounselingListParams {
  page: number
  size: number
}

export const counselingApi = {
  // GET /students/:studentId/counselings (API 14)
  list: (studentId: string, params: CounselingListParams, signal: AbortSignal) =>
    api
      .get<CounselingListResponse>(`/students/${studentId}/counselings`, { params, signal })
      .then((response) => response.data),

  // POST /students/:studentId/counselings (API 15)
  create: (studentId: string, payload: CounselingPayload): Promise<void> =>
    api.post(`/students/${studentId}/counselings`, payload).then(() => undefined),

  // PATCH /students/:studentId/counselings/:counselingId (API 17)
  update: (studentId: string, counselingId: string, payload: CounselingPayload): Promise<void> =>
    api.patch(`/students/${studentId}/counselings/${counselingId}`, payload).then(() => undefined),

  // DELETE /students/:studentId/counselings/:counselingId (API 18)
  remove: (studentId: string, counselingId: string): Promise<void> =>
    api.delete(`/students/${studentId}/counselings/${counselingId}`).then(() => undefined),
}
