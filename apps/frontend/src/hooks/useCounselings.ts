import { counselingApi } from '@/api/counselingApi'
import { useFetch } from '@/hooks/useFetch'

export const COUNSELING_PAGE_SIZE = 10

export function useCounselings(studentId: string, page: number) {
  return useFetch(`counselings:${studentId}:${page}`, (signal) =>
    counselingApi.list(studentId, { page, size: COUNSELING_PAGE_SIZE }, signal),
  )
}
