import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/templates/PageHeader'
import { DataTable, type Column } from '@/components/templates/DataTable'
import { FilterBar } from '@/components/common/FilterBar'
import { SearchInput } from '@/components/common/SearchInput'
import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { EXAM_PAGE_SIZE, useExams } from '@/hooks/useExams'
import { formatCreatedDate, formatSerial, formatShortDate } from '@/lib/format'
import type { ExamSummary } from '@/types/exam'

// 테이블의 한 행
type ExamRow = ExamSummary & { serial: string }

// 테이블의 한 열 (컬럼)
// 일련번호 | 시험일자 | 시험이름 | 반 | 응시인원 | 생성일시
const COLUMNS: Column<ExamRow>[] = [
  { key: 'serial', header: '번호', className: 'w-24 tabular-nums' },
  { key: 'examDate', header: '시험일자', cell: (exam) => formatShortDate(exam.examDate) },
  { key: 'name', header: '시험명', className: 'font-medium' },
  {
    key: 'className',
    header: '반',
    cell: (exam) => exam.className ?? <span className="text-muted-foreground">삭제된 반</span>,
  },
  { key: 'participantCount', header: '응시인원', cell: (exam) => `${exam.participantCount}명` },
  { key: 'createdAt', header: '생성일시', cell: (exam) => formatCreatedDate(exam.createdAt) },
]

export default function ExamListPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search.trim())

  const { data, latestData, loading, error } = useExams({ q: debouncedSearch, page })

  // 전체 시험 수
  const count = latestData?.count ?? 0

  // data가 null(로딩 중·에러)이면 빈 배열. index는 현재 페이지에서 몇 번째 줄인지(0부터)이다.
  const rows: ExamRow[] = (data?.exams ?? []).map((exam, index) => ({
    ...exam,
    serial: formatSerial(count, page, EXAM_PAGE_SIZE, index),
  }))

  return (
    <div>
      <PageHeader
        title="시험 관리"
        guide="시험 이름으로 검색하고, 시험을 눌러 성적과 통계를 확인할 수 있습니다."
        description="반별 시험을 만들고 성적을 입력·관리합니다."
        actions={
          <>
            <Button type="button" variant="outline">
              시험 복사
            </Button>
            <Button type="button">
              <Plus />
              시험 추가
            </Button>
          </>
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
        columns={COLUMNS}
        rows={rows}
        rowKey={(exam) => exam.id}
        loading={loading}
        empty={
          error
            ? { title: '시험 목록을 불러오지 못했습니다', description: error }
            : { title: '조건에 맞는 시험이 없습니다', description: '검색어를 다르게 입력해 보세요.' }
        }
        // 표 아래 "전체 N건 중 a–b건 표시 / 이전 다음" 영역
        pagination={{
          page,
          pageSize: EXAM_PAGE_SIZE,
          total: count,
          unit: '건',
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
