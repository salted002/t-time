import { reportSingleApi } from '@/api/reportSingleApi'
import { useFetch } from '@/hooks/useFetch'

export function useSingleReportPreview(studentId: string, examId: string) {
  return useFetch(`reportSingle:${studentId}:${examId}`, (signal) =>
    reportSingleApi.preview(studentId, examId, signal),
  )
}
