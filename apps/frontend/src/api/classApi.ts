import { api } from '@/lib/api';
import type { ClassDetail, ClassSummary } from '@/types/class';

export const classApi = {
  // GET /classes
  list: (signal: AbortSignal): Promise<ClassSummary[]> =>
    api
      .get<{ classes: ClassSummary[] }>('/classes', { signal })
      .then((response) => response.data.classes),

  // GET /classes/:classId
  get: (classId: string, signal: AbortSignal): Promise<ClassDetail> =>
    api
      .get<{ class: ClassDetail }>(`/classes/${classId}`, { signal })
      .then((response) => response.data.class),

  // POST /classes (다른 반 소속 학생은 새 반으로 이동)
  create: (payload: { name: string; teacherName: string | null; studentIds: string[] }): Promise<ClassSummary> =>
    api.post<{ class: ClassSummary }>('/classes', payload).then((response) => response.data.class),

  // PATCH /classes/:classId (studentIds는 소속 학생 전체를 대체, 빠진 학생은 반 없음)
  update: (
    classId: string,
    payload: { name: string; teacherName: string | null; studentIds: string[] },
  ): Promise<ClassSummary> =>
    api.patch<{ class: ClassSummary }>(`/classes/${classId}`, payload).then((response) => response.data.class),

  // DELETE /classes/:classId
  remove: (classId: string) => api.delete(`/classes/${classId}`),
};
