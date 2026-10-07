import { useState } from 'react'
import { BookOpen, Plus, School } from 'lucide-react'
import { PageHeader } from '@/components/templates/PageHeader'
import { DataTable, type Column } from '@/components/templates/DataTable'
import { InitialAvatar } from '@/components/common/InitialAvatar'
import { ClassCreateModal } from '@/components/classes/ClassCreateModal'
import { ClassDetailModal } from '@/components/classes/ClassDetailModal'
import { Button } from '@/components/ui/button'
import { classApi } from '@/api/classApi'
import { useFetch } from '@/hooks/useFetch'
import type { ClassSummary } from '@/types/class'
import { PAGE_TEXT } from '@/lib/pageText'

const COLUMNS: Column<ClassSummary>[] = [
  {
    key: 'name',
    header: '반 이름',
    className: 'font-semibold',
    cell: (item) => (
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-foreground"
        >
          <BookOpen className="size-4" />
        </span>
        {item.name}
      </div>
    ),
  },
  {
    key: 'teacherName',
    header: '담임강사',
    cell: (item) =>
      item.teacherName ? (
        <div className="flex items-center gap-2.5">
          <InitialAvatar name={item.teacherName} />
          {item.teacherName}
        </div>
      ) : (
        <span className="text-muted-foreground">(미지정)</span>
      ),
  },
  {
    key: 'studentCount',
    header: '학생 수',
    className: 'text-right tabular-nums',
    cell: (item) => `${item.studentCount}명`,
  },
]

// 반목록페이지 (SCR-CLASS-LIST)
export default function ClassListPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const { data, loading, error, refetch } = useFetch('classes', classApi.list)

  return (
    <div>
      <PageHeader
        title="반 관리"
        icon={School}
        {...PAGE_TEXT.CLASS_LIST}
        actions={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus /> 반 추가
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

      <ClassCreateModal open={createOpen} onOpenChange={setCreateOpen} onCreated={refetch} />

      {selectedId && (
        <ClassDetailModal
          classId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={refetch}
        />
      )}
    </div>
  )
}
