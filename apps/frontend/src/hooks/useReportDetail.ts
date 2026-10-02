import { reportDetailApi } from '@/api/reportDetailApi'
import { useFetch } from '@/hooks/useFetch'

export function useReportDetail(reportId: string | undefined) {
  return useFetch(reportId ? `reportDetail:${reportId}` : null, (signal) =>
    reportDetailApi.get(reportId ?? '', signal),
  )
}
