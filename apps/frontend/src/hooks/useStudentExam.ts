import { studentExamApi } from '@/api/studentExamApi'
import { useFetch } from '@/hooks/useFetch'

export function useStudentExam(studentId: string | null, examId: string | null) {
  const key = studentId && examId ? `studentExam:${studentId}:${examId}` : null

  return useFetch(key, (signal) => studentExamApi.get(studentId ?? '', examId ?? '', signal))
}
