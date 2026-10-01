import { examApi } from '@/api/examApi'
import { useFetch } from './useFetch'

export const EXAM_PAGE_SIZE = 10

export function useExams({ q, page }: { q: string; page: number }) {
  return useFetch(`exams:${JSON.stringify({ q, page })}`, (signal) =>
    examApi.list({ q, page, size: EXAM_PAGE_SIZE }, signal),
  )
}
