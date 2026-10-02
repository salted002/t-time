import { api } from '@/lib/api'
import type { ReportDetail } from '@/types/reportDetail'

export const reportDetailApi = {
  // GET /reports/:reportId (API 31)
  get: (reportId: string, signal: AbortSignal): Promise<ReportDetail> =>
    api
      .get<{ report: ReportDetail }>(`/reports/${reportId}`, { signal })
      .then((response) => response.data.report),

  // PATCH /reports/:reportId (API 32)
  updateTeacherFeedback: (reportId: string, teacherFeedback: string) =>
    api.patch(`/reports/${reportId}`, { teacherFeedback }),
}
