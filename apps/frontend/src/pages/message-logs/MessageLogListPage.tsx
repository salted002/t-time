import { useState } from 'react'
import { Send } from 'lucide-react'
import { PageHeader } from '@/components/templates/PageHeader'
import { DataTable, type Column } from '@/components/templates/DataTable'
import { MessageLogDetailModal } from '@/components/message-logs/MessageLogDetailModal'
import { InitialAvatar } from '@/components/common/InitialAvatar'
import { StatusBadge } from '@/components/common/StatusBadge'
import { messageLogApi } from '@/api/messageLogApi'
import { useFetch } from '@/hooks/useFetch'
import { formatCreatedDateTime } from '@/lib/format'
import type { MessageLogSummary } from '@/types/messageLog'
import { PAGE_TEXT } from '@/lib/pageText'

const PAGE_SIZE = 20

const COLUMNS: Column<MessageLogSummary>[] = [
  {
    key: 'sentAt',
    header: '발송일시',
    className: 'tabular-nums whitespace-nowrap text-muted-foreground',
    cell: (log) => formatCreatedDateTime(log.sentAt),
  },
  {
    key: 'studentName',
    header: '수신자',
    className: 'font-semibold',
    cell: (log) => (
      <div className="flex items-center gap-2.5">
        <InitialAvatar name={log.studentName} />
        {log.studentName}
      </div>
    ),
  },
  { key: 'recipientPhone', header: '수신번호', className: 'tabular-nums whitespace-nowrap' },
  {
    key: 'status',
    header: '발송결과',
    className: 'whitespace-nowrap',
    cell: (log) => (
      <StatusBadge tone={log.status === '성공' ? 'success' : 'destructive'}>
        {log.status}
      </StatusBadge>
    ),
  },
  {
    key: 'messagePreview',
    header: '메시지',
    className: 'w-full max-w-0 truncate text-muted-foreground',
  },
]

// SMS발송이력페이지 (SCR-SEND-HISTORY), 조회 전용
export default function MessageLogListPage() {
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data, latestData, loading, error } = useFetch(`message-logs:${page}`, (signal) =>
    messageLogApi.list({ page, size: PAGE_SIZE }, signal),
  )

  return (
    <div>
      <PageHeader title="발송 이력" icon={Send} {...PAGE_TEXT.MESSAGE_LOG_LIST} />

      <DataTable
        columns={COLUMNS}
        rows={data?.messageLogs ?? []}
        rowKey={(log) => log.id}
        onRowClick={(log) => setSelectedId(log.id)}
        loading={loading}
        empty={
          error
            ? { title: '발송 이력을 불러오지 못했습니다', description: error }
            : {
                title: '발송 이력이 없습니다',
                description: '리포트를 학부모에게 보내면 이곳에 기록됩니다.',
              }
        }
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total: latestData?.count ?? 0,
          unit: '건',
          onPageChange: setPage,
        }}
      />

      <MessageLogDetailModal logId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
