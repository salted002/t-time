import { useEffect, useState } from 'react';
import axios from 'axios';
import { api } from '@/lib/api';
import type { Student, StudentStatus } from '@/types/student';

export const STUDENT_PAGE_SIZE = 20;

interface StudentListParams {
  q: string;
  status: StudentStatus | 'all';
  classId: string | 'all';
  page: number;
}

interface StudentListResponse {
  students: Student[];
  count: number;
}

interface StudentListResult {
  key: string;
  students: Student[];
  count: number;
  error: string | null;
}

export function useStudentList({ q, status, classId, page }: StudentListParams) {
  const [result, setResult] = useState<StudentListResult | null>(null);
  const requestKey = JSON.stringify({ q, status, classId, page });

  useEffect(() => {
    let ignore = false;
    const key = JSON.stringify({ q, status, classId, page });
    const params = {
      page,
      size: STUDENT_PAGE_SIZE,
      ...(q && { q }),
      ...(status !== 'all' && { status }),
      ...(classId !== 'all' && { classId }),
    };

    api
      .get<StudentListResponse>('/students', { params })
      .then((response) => {
        if (!ignore) {
          setResult({ key, students: response.data.students, count: response.data.count, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          const message = axios.isAxiosError(error)
            ? (error.response?.data as { message?: string } | undefined)?.message
            : undefined;
          setResult({ key, students: [], count: 0, error: message ?? '학생 목록을 불러오지 못했습니다.' });
        }
      });

    return () => {
      ignore = true;
    };
  }, [q, status, classId, page]);

  // 응답이 현재 조건과 다르면 아직 요청 중인 상태
  const loading = result?.key !== requestKey;

  return {
    students: loading ? [] : (result?.students ?? []),
    count: result?.count ?? 0,
    loading,
    error: loading ? null : (result?.error ?? null),
  };
}
