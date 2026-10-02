import { api } from '@/lib/api'
import type { Student } from '@/types/student'
import type {
  BatchCandidate,
  BulkReportItem,
  ReportListResponse,
  ReportPreview,
  SavedReport,
} from '@/types/report'

interface ReportListParams {
  q: string
  page: number
  size: number
}

// 서버가 허용하는 size 최대값(200)
const STUDENT_FETCH_SIZE = 200

export const reportApi = {
  // GET /reports (API 30)
  list: (params: ReportListParams, signal: AbortSignal) =>
    api
      .get<ReportListResponse>('/reports', {
        params: { page: params.page, size: params.size, ...(params.q && { q: params.q }) },
        signal,
      })
      .then((response) => response.data),

  // GET /students — 리포트 만들기 ① 학생 선택용 (재원생 전체)
  students: (signal: AbortSignal): Promise<Student[]> =>
    api
      .get<{ students: Student[] }>('/students', {
        params: { status: '재원', size: STUDENT_FETCH_SIZE },
        signal,
      })
      .then((response) => response.data.students),

  // POST /reports/subject-options (API 33)
  subjectOptions: (studentIds: string[], signal: AbortSignal): Promise<string[]> =>
    api
      .post<{ subjectNames: string[] }>('/reports/subject-options', { studentIds }, { signal })
      .then((response) => response.data.subjectNames),

  // POST /reports/batch-preview (API 34)
  batchPreview: (
    studentIds: string[],
    subjectNames: string[],
    signal: AbortSignal,
  ): Promise<BatchCandidate[]> =>
    api
      .post<{ candidates: BatchCandidate[] }>(
        '/reports/batch-preview',
        { studentIds, subjectNames },
        { signal },
      )
      .then((response) => response.data.candidates),

  // POST /reports/preview (API 27) — 일괄 흐름: 학생 1명 + 선택한 과목들
  preview: (studentId: string, subjectNames: string[], signal: AbortSignal): Promise<ReportPreview> =>
    api
      .post<{ preview: ReportPreview }>('/reports/preview', { studentId, subjectNames }, { signal })
      .then((response) => response.data.preview),

  // POST /reports/bulk (API 35) — 저장 + 공유 링크 생성
  saveBulk: (reports: BulkReportItem[]): Promise<SavedReport[]> =>
    api.post<{ reports: SavedReport[] }>('/reports/bulk', { reports }).then((response) => response.data.reports),
}
