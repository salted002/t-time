import { api } from '@/lib/api'
import type { ReportListResponse } from '@/types/report'

interface ReportListParams {
  q: string
  page: number
  size: number
}

export const reportApi = {
  // GET /reports (API 30)
  list: (params: ReportListParams, signal: AbortSignal) =>
    api
      .get<ReportListResponse>('/reports', {
        params: { page: params.page, size: params.size, ...(params.q && { q: params.q }) },
        signal,
      })
      .then((response) => response.data),
}
