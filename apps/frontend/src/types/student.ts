export type StudentStatus = '재원' | '휴원' | '퇴원'

export interface Student {
  id: string
  name: string
  classId: string | null
  className: string | null
  status: StudentStatus
  school: string
  grade: string
  parentPhone: string
  enrolledAt: string | null
}
