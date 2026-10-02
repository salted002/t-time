import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/templates/PageHeader';
import { DataTable, type Column } from '@/components/templates/DataTable';
import { ClassDetailModal } from '@/components/classes/ClassDetailModal';
import { Button } from '@/components/ui/button';
import { classApi } from '@/api/classApi';
import { useFetch } from '@/hooks/useFetch';
import type { ClassSummary } from '@/types/class';

const COLUMNS: Column<ClassSummary>[] = [
  { key: 'name', header: '반 이름', className: 'font-medium' },
  {
    key: 'teacherName',
    header: '담임강사',
    cell: (item) => item.teacherName ?? <span className="text-muted-foreground">(미지정)</span>,
  },
  {
    key: 'studentCount',
    header: '학생 수',
    className: 'tabular-nums',
    cell: (item) => `${item.studentCount}명`,
  },
];

// 반목록페이지 (SCR-CLASS-LIST)
export default function ClassListPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, loading, error, refetch } = useFetch('classes', classApi.list);

  return (
    <div>
      <PageHeader
        title="반 관리"
        guide="반을 만들고 담임강사와 소속 학생을 관리할 수 있습니다."
        description="학원의 반 목록과 반별 학생 수를 확인합니다."
        actions={
          // TODO: 반 추가 화면 연결
          <Button type="button">
            <Plus />
            반 추가
          </Button>
        }
      />

      <DataTable
        columns={COLUMNS}
        rows={data ?? []}
        rowKey={(item) => item.id}
        onRowClick={(item) => setSelectedId(item.id)}
        loading={loading}
        empty={
          error
            ? { title: '반 목록을 불러오지 못했습니다', description: error }
            : { title: '등록된 반이 없습니다', description: '[반 추가]로 첫 반을 만들어 보세요.' }
        }
      />

      <ClassDetailModal
        classId={selectedId}
        onClose={() => setSelectedId(null)}
        onDeleted={refetch}
      />
    </div>
  );
}
