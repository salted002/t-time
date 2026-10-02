import type { StudentStatus } from '@/types/student';

export interface ClassSummary {
  id: string;
  name: string;
  teacherName: string | null;
  studentCount: number;
}

export interface ClassDetail extends ClassSummary {
  students: { id: string; name: string; status: StudentStatus }[];
}
