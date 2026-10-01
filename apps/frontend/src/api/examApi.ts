import { api } from '@/lib/api'
import type { ExamListResponse } from '@/types/exam'

// 시험 목록 요청에 보낼 값
interface ExamListParams {
  q: string
  page: number
  size: number
}

// 시험 관련 서버 요청 함수 모음
export const examApi = {
  list: (params: ExamListParams, signal: AbortSignal) =>
    api
      .get<ExamListResponse>('/exams', {
        params: { page: params.page, size: params.size, ...(params.q && { q: params.q }) },
        signal,
      })
      .then((response) => response.data),
}
