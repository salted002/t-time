import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, Copy, Send } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/templates/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LockedFeatureOverlay } from '@/components/common/LockedFeatureOverlay'
import { ScoreTrendChart } from '@/components/charts/ScoreTrendChart'
import { SendSingleModal } from '@/components/reports/SendSingleModal'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { reportDetailApi } from '@/api/reportDetailApi'
import { reportSingleApi } from '@/api/reportSingleApi'
import { useReportDetail } from '@/hooks/useReportDetail'
import { useStudentDetail } from '@/hooks/useStudentDetail'
import { getErrorMessage } from '@/lib/errors'
import { formatCreatedDateTime, formatFullDate, formatShortDate } from '@/lib/format'
import type { ReportDetail } from '@/types/reportDetail'
import type { ShareLink } from '@/types/reportSingle'

// 리포트상세페이지 (SCR-REPORT-DETAIL)
export default function ReportDetailPage() {
  const { slug, reportId } = useParams<{ slug: string; reportId: string }>()
  const { data: report, loading, error, refetch } = useReportDetail(reportId)

  const backPath = `/${slug}/reports`

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div>
        <PageHeader
          title="리포트 상세"
          guide="저장된 리포트의 통계와 선생님 피드백을 확인하고 학부모에게 발송합니다."
          back={{ label: '리포트 목록으로', to: backPath }}
        />
        <SectionCard>
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">{error ?? '리포트를 찾을 수 없습니다.'}</p>
            <Button type="button" variant="outline" size="sm" onClick={refetch}>
              다시 시도
            </Button>
          </div>
        </SectionCard>
      </div>
    )
  }

  return <ReportDetailView report={report} backPath={backPath} />
}

interface ReportDetailViewProps {
  report: ReportDetail
  backPath: string
}

function ReportDetailView({ report, backPath }: ReportDetailViewProps) {
  const { student, loading: studentLoading } = useStudentDetail(report.studentId)

  const [selected, setSelected] = useState(report.subjectNames[0] ?? '')
  const [savedFeedback, setSavedFeedback] = useState(report.teacherFeedback ?? '')
  const [feedback, setFeedback] = useState(report.teacherFeedback ?? '')
  const [savingFeedback, setSavingFeedback] = useState(false)
  const [link, setLink] = useState<ShareLink | null>(
    report.shareLink && !report.shareLink.expired
      ? { url: report.shareLink.url, expiresAt: report.shareLink.expiresAt }
      : null,
  )
  const [preparing, setPreparing] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const subjectName = report.subjectNames.includes(selected)
    ? selected
    : (report.subjectNames[0] ?? '')
  const stat = report.subjectStats[subjectName]
  const averageByExam = new Map(
    (stat?.classAverageRecent10 ?? []).map((point) => [point.examId, point.average]),
  )
  const trend = (stat?.recent10 ?? []).map((point) => ({
    label: formatShortDate(point.examDate),
    personal: point.score,
    average: averageByExam.get(point.examId) ?? null,
  }))
  const subjectItems = report.subjectNames.map((name) => ({ value: name, label: name }))
  const aiComment = report.aiFeedback?.[subjectName]?.trim()

  const dirty = feedback.trim() !== savedFeedback.trim()

  const saveFeedback = async () => {
    setSavingFeedback(true)
    try {
      const value = feedback.trim()
      await reportDetailApi.updateTeacherFeedback(report.id, value)
      setSavedFeedback(value)
      setFeedback(value)
      toast.success('선생님 피드백이 저장되었습니다.')
    } catch (e) {
      toast.error(getErrorMessage(e, '선생님 피드백을 저장하지 못했습니다.'))
    } finally {
      setSavingFeedback(false)
    }
  }

  // 링크가 없거나 만료됐으면 새로 만들고, 유효하면 기존 링크를 그대로 돌려받는다.
  const openSend = async () => {
    setPreparing(true)
    try {
      setLink(await reportSingleApi.createShareLink(report.id))
      setSendOpen(true)
    } catch (e) {
      toast.error(getErrorMessage(e, '공유 링크를 준비하지 못했습니다.'))
    } finally {
      setPreparing(false)
    }
  }

  const copyLink = async () => {
    if (!link) return
    await navigator.clipboard.writeText(link.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${report.studentName} 리포트`}
        guide="저장된 리포트의 통계와 선생님 피드백을 확인하고 학부모에게 발송합니다. 통계는 열 때마다 최신 성적으로 다시 계산됩니다."
        description={`${report.className ?? '(미배정)'} · ${formatCreatedDateTime(report.createdAt)} 생성`}
        back={{ label: '리포트 목록으로', to: backPath }}
        actions={
          <Button type="button" onClick={openSend} disabled={preparing || studentLoading}>
            <Send />이 리포트 발송하기
          </Button>
        }
      />

      <SectionCard title="과목별 통계">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">과목 선택</span>
            <Select
              items={subjectItems}
              value={subjectName}
              onValueChange={(value) => value && setSelected(value as string)}
            >
              <SelectTrigger className="w-48" aria-label="과목 선택">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subjectItems.map((subject) => (
                  <SelectItem key={subject.value} value={subject.value}>
                    {subject.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ScoreTrendChart title="최근 10회 점수 추이" data={trend} series={['personal']} />
            <ScoreTrendChart
              title="같은 반 평균 대비 10회 추이"
              data={trend}
              series={['personal', 'average']}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="AI 피드백">
        <LockedFeatureOverlay
          locked={!report.subscribed}
          title="구독 전용 기능이에요"
          description="구독하면 AI 과목별 피드백을 리포트에 담을 수 있어요."
        >
          <div className="flex flex-col gap-2 p-4">
            <h3 className="text-sm font-semibold">AI 과목별 피드백 · {subjectName}</h3>
            <p className="text-sm whitespace-pre-wrap">
              {aiComment || (
                <span className="text-muted-foreground">이 과목의 AI 피드백이 없습니다.</span>
              )}
            </p>
          </div>
        </LockedFeatureOverlay>
      </SectionCard>

      <SectionCard
        title="선생님 피드백"
        actions={
          <Button
            type="button"
            size="sm"
            onClick={saveFeedback}
            disabled={!dirty || savingFeedback}
          >
            저장
          </Button>
        }
      >
        <Textarea
          rows={5}
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="학부모에게 전달할 피드백을 입력하세요."
          aria-label="선생님 피드백"
        />
      </SectionCard>

      <SectionCard title="공유 링크">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {link ? (
              <StatusBadge tone="success">유효</StatusBadge>
            ) : (
              <StatusBadge tone={report.shareLink ? 'destructive' : 'muted'}>
                {report.shareLink ? '만료됨' : '없음'}
              </StatusBadge>
            )}
            <span className="text-sm text-muted-foreground tabular-nums">
              {link
                ? `링크 만료: ${formatFullDate(link.expiresAt)}`
                : report.shareLink
                  ? `${formatFullDate(report.shareLink.expiresAt)}에 만료됨`
                  : '발송하면 공유 링크가 만들어집니다.'}
            </span>
          </div>
          {link && (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={link.url}
                aria-label="공유 링크"
                className="h-9 min-w-0 flex-1 rounded-md border bg-muted/40 px-3 text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={copyLink}>
                {copied ? <Check /> : <Copy />}
                링크 복사
              </Button>
            </div>
          )}
          {!link && report.shareLink && (
            <p className="text-xs text-muted-foreground">
              [이 리포트 발송하기]를 누르면 새 링크가 만들어집니다.
            </p>
          )}
        </div>
      </SectionCard>

      {sendOpen && link && !studentLoading && (
        <SendSingleModal
          reportId={report.id}
          studentName={report.studentName}
          defaultPhone={student?.parentPhone ?? ''}
          link={link.url}
          onClose={() => setSendOpen(false)}
          onSent={() => undefined}
        />
      )}
    </div>
  )
}
