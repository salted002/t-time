import { studentExamApi } from '@/api/studentExamApi'
import { useFetch } from '@/hooks/useFetch'

// REQ-STU-09: 페이지당 10건
export const STUDENT_EXAM_PAGE_SIZE = 10

export function useStudentExams(studentId: string, page: number) {
  return useFetch(`studentExams:${studentId}:${page}`, (signal) =>
    studentExamApi.list(studentId, { page, size: STUDENT_EXAM_PAGE_SIZE }, signal),
  )
}
