import { useFetch } from '@/hooks/useFetch'
import { examApi } from '@/api/examApi'

// examId가 null이면 요청하지 않는다.
export function useExam(examId: string | null) {
  return useFetch(examId === null ? null : `exam:${examId}`, (signal) =>
    examApi.get(examId ?? '', signal),
  )
}
