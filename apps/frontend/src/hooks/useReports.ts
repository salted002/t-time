import { useFetch } from '@/hooks/useFetch'
import { reportApi } from '@/api/reportApi'

export const REPORT_PAGE_SIZE = 10

export function useReports({ q, page }: { q: string; page: number }) {
  return useFetch(`reports:${JSON.stringify({ q, page })}`, (signal) =>
    reportApi.list({ q, page, size: REPORT_PAGE_SIZE }, signal),
  )
}
