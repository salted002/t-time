import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface ClassSummary {
  id: string;
  name: string;
  teacherName: string | null;
  studentCount: number;
}

interface ClassListResponse {
  classes: ClassSummary[];
}

export function useClassList() {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    api
      .get<ClassListResponse>('/classes')
      .then((response) => {
        if (!ignore) setClasses(response.data.classes);
      })
      .catch(() => {
        if (!ignore) setError('반 목록을 불러오지 못했습니다.');
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { classes, error };
}
