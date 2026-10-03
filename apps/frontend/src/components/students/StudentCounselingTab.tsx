import { useState } from 'react'
import { Plus } from 'lucide-react'
import { DataTable, type Column } from '@/components/templates/DataTable'
import { Button } from '@/components/ui/button'
import { CounselingDetailModal } from '@/components/students/CounselingDetailModal'
import { CounselingFormModal } from '@/components/students/CounselingFormModal'
import { COUNSELING_PAGE_SIZE, useCounselings } from '@/hooks/useCounselings'
import { formatShortDate } from '@/lib/format'
import type { Counseling } from '@/types/counseling'

const CONTENT_MAX_LENGTH = 30

const COLUMNS: Column<Counseling>[] = [
  { key: 'counselingDate', header: '상담날짜', cell: (row) => formatShortDate(row.counselingDate), className: 'w-28 tabular-nums' },
  { key: 'target', header: '대상', className: 'w-24' },
  { key: 'counselorName', header: '상담자명', className: 'w-32' },
  {
    key: 'content',
    header: '상담내용',
    cell: (row) =>
      row.content.length > CONTENT_MAX_LENGTH
        ? `${row.content.slice(0, CONTENT_MAX_LENGTH)}…`
        : row.content,
  },
]

type ModalState =
  | { type: 'detail'; counseling: Counseling }
  | { type: 'create' }
  | { type: 'edit'; counseling: Counseling }
  | null

interface StudentCounselingTabProps {
  studentId: string
}

// 학생상세_상담탭 (SCR-STU-COUNSEL-LIST)
export function StudentCounselingTab({ studentId }: StudentCounselingTabProps) {
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<ModalState>(null)

  const { data, latestData, loading, error, refetch } = useCounselings(studentId, page)
  const count = latestData?.count ?? 0
  const rows = data?.counselings ?? []

  const close = () => setModal(null)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setModal({ type: 'create' })}>
          <Plus />
          상담 추가
        </Button>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        rowKey={(row) => row.id}
        onRowClick={(row) => setModal({ type: 'detail', counseling: row })}
        loading={loading}
        empty={
          error
            ? { title: '상담 이력을 불러오지 못했습니다', description: error }
            : { title: '상담 이력이 없습니다', description: '[상담 추가]로 첫 상담을 기록해 보세요.' }
        }
        pagination={{
          page,
          pageSize: COUNSELING_PAGE_SIZE,
          total: count,
          unit: '건',
          onPageChange: setPage,
        }}
      />

      {modal?.type === 'detail' && (
        <CounselingDetailModal
          studentId={studentId}
          counseling={modal.counseling}
          onClose={close}
          onEdit={() => setModal({ type: 'edit', counseling: modal.counseling })}
          onDeleted={() => {
            // 마지막 페이지의 마지막 행을 지우면 빈 페이지가 되므로 한 페이지 앞으로 보낸다.
            if (rows.length === 1 && page > 1) setPage(page - 1)
            refetch()
            close()
          }}
        />
      )}

      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <CounselingFormModal
          studentId={studentId}
          counseling={modal.type === 'edit' ? modal.counseling : undefined}
          onClose={close}
          onSaved={() => {
            // 새 상담은 최신순 맨 앞에 들어가므로 1페이지로 이동한다.
            if (modal.type === 'create') setPage(1)
            refetch()
          }}
        />
      )}
    </div>
  )
}
