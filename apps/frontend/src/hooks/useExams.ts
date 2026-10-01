import { useFetch } from '@/hooks/useFetch'
import { examApi } from '@/api/examApi'

// 요구사항 REQ-EXAM-01: 페이지당 10건
export const EXAM_PAGE_SIZE = 10

export function useExams({ q, page }: { q: string; page: number }) {
  return useFetch(`exams:${JSON.stringify({ q, page })}`, (signal) =>
    examApi.list({ q, page, size: EXAM_PAGE_SIZE }, signal),
  )
}
