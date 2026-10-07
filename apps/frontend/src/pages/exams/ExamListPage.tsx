import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/templates/PageHeader'
import { DataTable, type Column } from '@/components/templates/DataTable'
import { FilterBar } from '@/components/common/FilterBar'
import { SearchInput } from '@/components/common/SearchInput'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ExamCopyModal } from '@/components/exams/ExamCopyModal'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { EXAM_PAGE_SIZE, useExams } from '@/hooks/useExams'
import { formatCreatedDate, formatSerial, formatShortDate } from '@/lib/format'
import type { ExamSummary } from '@/types/exam'
import { PAGE_TEXT } from '@/lib/pageText'

// DataTable 컬럼 key는 행의 속성명이어야 하므로 일련번호도 행 속성으로 붙인다.
type ExamRow = ExamSummary & { serial: string; select: string }

const COLUMNS: Column<ExamRow>[] = [
  { key: 'serial', header: '번호', className: 'w-24 tabular-nums text-muted-foreground' },
  {
    key: 'examDate',
    header: '시험일자',
    className: 'tabular-nums text-muted-foreground',
    cell: (exam) => formatShortDate(exam.examDate),
  },
  { key: 'name', header: '시험명', className: 'font-semibold' },
  {
    key: 'className',
    header: '반',
    cell: (exam) => exam.className ?? <span className="text-muted-foreground">삭제된 반</span>,
  },
  {
    key: 'participantCount',
    header: '응시인원',
    className: 'text-right tabular-nums',
    cell: (exam) => `${exam.participantCount}명`,
  },
  {
    key: 'createdAt',
    header: '생성일시',
    className: 'tabular-nums text-muted-foreground',
    cell: (exam) => formatCreatedDate(exam.createdAt),
  },
]

// 시험목록페이지 (SCR-EXAM-LIST)
export default function ExamListPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [copyMode, setCopyMode] = useState(false)
  const [selected, setSelected] = useState<ExamSummary | null>(null)
  const [copyOpen, setCopyOpen] = useState(false)

  const debouncedSearch = useDebouncedValue(search.trim())
  const { data, latestData, loading, error } = useExams({ q: debouncedSearch, page })

  // 로딩 중 건수가 0으로 깜빡이지 않도록 latestData 사용
  const count = latestData?.count ?? 0

  const rows: ExamRow[] = (data?.exams ?? []).map((exam, index) => ({
    ...exam,
    serial: formatSerial(count, page, EXAM_PAGE_SIZE, index),
    select: '',
  }))

  const exitCopyMode = () => {
    setCopyMode(false)
    setSelected(null)
  }

  const columns: Column<ExamRow>[] = copyMode
    ? [
        {
          key: 'select',
          header: '',
          className: 'w-10',
          cell: (exam) => (
            <Checkbox
              checked={selected?.id === exam.id}
              className="pointer-events-none"
              aria-label={`${exam.name} 선택`}
            />
          ),
        },
        ...COLUMNS,
      ]
    : COLUMNS

  return (
    <div>
      <PageHeader
        title="시험 관리"
        {...PAGE_TEXT.EXAM_LIST}
        actions={
          copyMode ? (
            <>
              <Button type="button" variant="outline" onClick={exitCopyMode}>
                취소
              </Button>
              <Button type="button" disabled={!selected} onClick={() => setCopyOpen(true)}>
                선택한 시험 복사
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setCopyMode(true)}>
                시험 복사
              </Button>
              <Button type="button" onClick={() => navigate(`/${slug}/exams/new`)}>
                <Plus />
                시험 추가
              </Button>
            </>
          )
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="시험 이름으로 검색"
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(exam) => exam.id}
        onRowClick={(exam) =>
          copyMode
            ? setSelected((prev) => (prev?.id === exam.id ? null : exam))
            : navigate(`/${slug}/exams/${exam.id}`)
        }
        loading={loading}
        empty={
          error
            ? { title: '시험 목록을 불러오지 못했습니다', description: error }
            : { title: '조건에 맞는 시험이 없습니다', description: '검색어를 바꿔 보세요.' }
        }
        pagination={{
          page,
          pageSize: EXAM_PAGE_SIZE,
          total: count,
          unit: '건',
          onPageChange: setPage,
        }}
      />

      {copyOpen && selected && (
        <ExamCopyModal
          exam={selected}
          onClose={() => setCopyOpen(false)}
          onCopied={(newId) => navigate(`/${slug}/exams/${newId}/results`)}
        />
      )}
    </div>
  )
}
