import { api } from '@/lib/api'
import type { ShareLink, SingleReportPayload, SingleReportPreview } from '@/types/reportSingle'

export const reportSingleApi = {
  // POST /reports/preview (API 27) — 단일 흐름: 학생 1명 + 시험 1개
  preview: (studentId: string, examId: string, signal: AbortSignal): Promise<SingleReportPreview> =>
    api
      .post<{ preview: SingleReportPreview }>('/reports/preview', { studentId, examId }, { signal })
      .then((response) => response.data.preview),

  // POST /reports (API 28) — 저장된 리포트 id 반환
  create: (payload: SingleReportPayload): Promise<string> =>
    api
      .post<{ report: { id: string } }>('/reports', payload)
      .then((response) => response.data.report.id),

  // POST /reports/:reportId/share-link (API 29)
  createShareLink: (reportId: string): Promise<ShareLink> =>
    api
      .post<{ shareLink: ShareLink }>(`/reports/${reportId}/share-link`)
      .then((response) => response.data.shareLink),
}
