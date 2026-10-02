import { api } from '@/lib/api'
import type { StudentStatus } from '@/types/student'

export interface StudentUpdateBody {
  name: string
  school: string
  grade: string
  classId: string | null
  status: StudentStatus
  parentPhone: string
  enrolledAt: string | null
}

interface StudentCreateResponse {
  student: { id: string; name: string; status: StudentStatus }
}

export const studentApi = {
  // POST /students
  create: (body: StudentUpdateBody): Promise<{ id: string }> =>
    api.post<StudentCreateResponse>('/students', body).then((response) => response.data.student),

  // PATCH /students/:studentId
  update: (studentId: string, body: StudentUpdateBody): Promise<void> =>
    api.patch(`/students/${studentId}`, body).then(() => undefined),

  // DELETE /students/:studentId
  remove: (studentId: string): Promise<void> =>
    api.delete(`/students/${studentId}`).then(() => undefined),
}
