import { useEffect, useState } from 'react';
import axios from 'axios';
import { api } from '@/lib/api';
import type { Student } from '@/types/student';

interface StudentDetailResponse {
  student: Student;
}

interface StudentDetailResult {
  studentId: string;
  student: Student | null;
  notFound: boolean;
  error: string | null;
}

export function useStudentDetail(studentId: string | undefined) {
  const [result, setResult] = useState<StudentDetailResult | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!studentId) return;

    let ignore = false;

    api
      .get<StudentDetailResponse>(`/students/${studentId}`)
      .then((response) => {
        if (!ignore) {
          setResult({ studentId, student: response.data.student, notFound: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (ignore) return;

        const notFound = axios.isAxiosError(error) && error.response?.status === 404;
        const message = axios.isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message
          : undefined;
        setResult({
          studentId,
          student: null,
          notFound,
          error: notFound ? null : (message ?? '학생 정보를 불러오지 못했습니다.'),
        });
      });

    return () => {
      ignore = true;
    };
  }, [studentId, reloadKey]);

  // 응답이 현재 학생과 다르면 아직 요청 중인 상태
  const loading = Boolean(studentId) && result?.studentId !== studentId;

  return {
    student: loading ? null : (result?.student ?? null),
    notFound: loading ? false : (result?.notFound ?? false),
    error: loading ? null : (result?.error ?? null),
    loading,
    refetch: () => setReloadKey((key) => key + 1),
  };
}
