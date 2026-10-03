import { ArrowRight, ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { FormDialog } from '@/components/common/FormDialog'
import { InfoGrid } from '@/components/common/InfoGrid'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { messageLogApi } from '@/api/messageLogApi'
import { useFetch } from '@/hooks/useFetch'
import { formatCreatedDateTime } from '@/lib/format'

interface MessageLogDetailModalProps {
  /** null이면 닫힘 */
  logId: string | null
  onClose: () => void
}

// SMS발송이력상세모달 (SCR-SEND-HISTORY-DETAIL), 조회 전용
export function MessageLogDetailModal({ logId, onClose }: MessageLogDetailModalProps) {
  const { slug } = useParams()
  const { data, loading, error } = useFetch(
    logId === null ? null : `message-log:${logId}`,
    (signal) => messageLogApi.get(logId ?? '', signal),
  )

  return (
    <FormDialog
      open={logId !== null}
      onOpenChange={(open) => !open && onClose()}
      title="발송 상세"
      cancel="닫기"
    >
      {loading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {data && (
        <InfoGrid
          columns={2}
          items={[
            {
              label: '발송일시',
              value: <span className="tabular-nums">{formatCreatedDateTime(data.sentAt)}</span>,
            },
            { label: '수신자', value: data.studentName },
            {
              label: '수신번호',
              value: <span className="tabular-nums">{data.recipientPhone}</span>,
            },
            {
              label: '발송결과',
              value: (
                <StatusBadge tone={data.status === '성공' ? 'success' : 'destructive'}>
                  {data.status}
                </StatusBadge>
              ),
            },
            { label: '메시지(전체)', value: data.message, span: 2 },
            {
              label: '보낸 링크',
              value: data.sentLink && (
                <a
                  href={`${window.location.origin}${data.sentLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-1 break-all text-primary underline-offset-4 hover:underline"
                >
                  {`${window.location.origin}${data.sentLink}`}
                  <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
                </a>
              ),
              span: 2,
            },
            {
              label: '링크 만료 여부',
              value:
                data.linkExpired === null ? null : (
                  <StatusBadge tone={data.linkExpired ? 'destructive' : 'success'}>
                    {data.linkExpired ? '만료됨' : '유효'}
                  </StatusBadge>
                ),
            },
            {
              label: '연결된 리포트',
              value: data.linkedReport && (
                <Link
                  to={`/${slug}/reports/${data.linkedReport.reportId}`}
                  className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                >
                  {data.linkedReport.studentName ?? '학생'} 리포트
                  <ArrowRight className="size-3.5" />
                </Link>
              ),
            },
          ]}
        />
      )}
    </FormDialog>
  )
}
