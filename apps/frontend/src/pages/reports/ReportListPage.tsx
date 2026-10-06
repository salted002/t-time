import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/templates/PageHeader'
import { DataTable, type Column } from '@/components/templates/DataTable'
import { FilterBar } from '@/components/common/FilterBar'
import { SearchInput } from '@/components/common/SearchInput'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { REPORT_PAGE_SIZE, useReports } from '@/hooks/useReports'
import type { Tone } from '@/lib/constants'
import { formatCreatedDate, formatCreatedDateTime } from '@/lib/format'
import type { ReportSummary, ShareLinkStatus } from '@/types/report'
import { PAGE_TEXT } from '@/lib/pageText'

const SHARE_LINK_TONE = {
  없음: 'muted',
  유효: 'success',
  만료됨: 'destructive',
} as const satisfies Record<ShareLinkStatus, Tone>

const COLUMNS: Column<ReportSummary>[] = [
  { key: 'studentName', header: '학생명', className: 'font-medium' },
  { key: 'subjectCount', header: '과목수', cell: (report) => `${report.subjectCount}개` },
  {
    key: 'createdAt',
    header: '생성일시',
    className: 'tabular-nums',
    cell: (report) => formatCreatedDateTime(report.createdAt),
  },
  {
    key: 'shareLinkStatus',
    header: '공유링크',
    cell: (report) => (
      <div className="flex items-center gap-2">
        <StatusBadge tone={SHARE_LINK_TONE[report.shareLinkStatus]}>
          {report.shareLinkStatus}
        </StatusBadge>
        {report.shareLinkStatus === '유효' && report.shareLinkExpiresAt && (
          <span className="text-xs text-muted-foreground tabular-nums">
            ~{formatCreatedDate(report.shareLinkExpiresAt)}
          </span>
        )}
      </div>
    ),
  },
]

// 리포트목록페이지 (SCR-REPORT-LIST)
export default function ReportListPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebouncedValue(search.trim())
  const { data, latestData, loading, error } = useReports({ q: debouncedSearch, page })

  const count = latestData?.count ?? 0

  return (
    <div>
      <PageHeader
        title="리포트 관리"
        {...PAGE_TEXT.REPORT_LIST}
        actions={
          <Button type="button" onClick={() => navigate(`/${slug}/reports/new`)}>
            <Plus />
            리포트 만들기
          </Button>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="학생 이름으로 검색"
        />
      </FilterBar>

      <DataTable
        columns={COLUMNS}
        rows={data?.reports ?? []}
        rowKey={(report) => report.id}
        onRowClick={(report) => navigate(`/${slug}/reports/${report.id}`)}
        loading={loading}
        empty={
          error
            ? { title: '리포트 목록을 불러오지 못했습니다', description: error }
            : {
                title: '저장된 리포트가 없습니다',
                description: '[리포트 만들기]로 첫 리포트를 만들어 보세요.',
              }
        }
        pagination={{
          page,
          pageSize: REPORT_PAGE_SIZE,
          total: count,
          unit: '건',
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
