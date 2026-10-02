import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import { adminApi, type AdminAcademy } from '@/api/adminApi';
import { PageHeader } from '@/components/templates/PageHeader';
import { DataTable, type Column } from '@/components/templates/DataTable';
import { getErrorMessage } from '@/lib/errors';

const ACADEMY_PAGE_SIZE = 20;

const dash = (value: string | null) => value ?? <span className="text-muted-foreground">-</span>;

// 학생수 컬럼은 백엔드가 재원 학생만 세어서 내려주므로 "재원수"로 표시한다.
const COLUMNS: Column<AdminAcademy>[] = [
  { key: 'name', header: '학원명', className: 'font-medium' },
  { key: 'phone', header: '대표연락처', cell: (academy) => dash(academy.phone) },
  { key: 'ownerName', header: '대표자명', cell: (academy) => dash(academy.ownerName) },
  { key: 'studentCount', header: '재원수' },
  { key: 'loginEmail', header: '로그인이메일', cell: (academy) => dash(academy.loginEmail) },
];

interface AcademyListResult {
  page: number;
  academies: AdminAcademy[];
  count: number;
  error: string | null;
}

// 학원목록페이지 (SCR-ADMIN-ACADEMY-LIST)
export default function AdminAcademyListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<AcademyListResult | null>(null);

  useEffect(() => {
    let ignore = false;

    adminApi
      .listAcademies({ page, size: ACADEMY_PAGE_SIZE })
      .then((data) => {
        if (!ignore) {
          setResult({ page, academies: data.academies, count: data.count, error: null });
        }
      })
      .catch((e: unknown) => {
        if (ignore) return;
        if (axios.isAxiosError(e) && e.response?.status === 401) {
          navigate('/admin/login', { replace: true });
          return;
        }
        setResult({
          page,
          academies: [],
          count: 0,
          error: getErrorMessage(e, '학원 목록을 불러오지 못했습니다.'),
        });
      });

    return () => {
      ignore = true;
    };
  }, [page, navigate]);

  // 응답이 현재 페이지와 다르면 아직 요청 중인 상태
  const loading = result?.page !== page;

  return (
    <div>
      <PageHeader
        title="학원 목록"
        guide="서비스에 가입한 전체 학원을 확인합니다."
        description="재원수는 현재 재원 중인 학생만 집계합니다."
      />

      <DataTable
        columns={COLUMNS}
        rows={loading ? [] : (result?.academies ?? [])}
        rowKey={(academy) => academy.id}
        loading={loading}
        empty={
          result?.error
            ? { title: '학원 목록을 불러오지 못했습니다', description: result.error }
            : { title: '가입한 학원이 없습니다' }
        }
        pagination={{
          page,
          pageSize: ACADEMY_PAGE_SIZE,
          total: result?.count ?? 0,
          unit: '개',
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
