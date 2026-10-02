import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { SlidePanel } from '@/components/common/SlidePanel'
import { ScoreCompareChart } from '@/components/charts/ScoreCompareChart'
import { ScoreTrendChart } from '@/components/charts/ScoreTrendChart'
import { AiFeedbackSection } from '@/components/reports/AiFeedbackSection'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { reportSingleApi } from '@/api/reportSingleApi'
import { useSingleReportPreview } from '@/hooks/useSingleReportPreview'
import { getErrorMessage } from '@/lib/errors'
import { formatFullDate, formatScore, formatShortDate } from '@/lib/format'
import type { ShareLink, SingleReportPreview } from '@/types/reportSingle'

interface ReportViewSingleSlideProps {
  studentId: string
  examId: string
  onClose: () => void
}

// 리포트미리보기슬라이드_단일 (SCR-REPORT-VIEW-SINGLE)
// 열 때마다 새로 마운트해서 쓴다. 저장 전 초안은 이 컴포넌트의 상태에만 있다.
export function ReportViewSingleSlide({ studentId, examId, onClose }: ReportViewSingleSlideProps) {
  const { data: preview, loading, error, refetch } = useSingleReportPreview(studentId, examId)

  const [selected, setSelected] = useState<string | null>(null)
  const [teacherFeedback, setTeacherFeedback] = useState('')
  const [aiEdits, setAiEdits] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [reportId, setReportId] = useState<string | null>(null)
  const [shareLink, setShareLink] = useState<ShareLink | null>(null)

  const aiFeedback = { ...(preview?.aiSubjectFeedback ?? {}), ...aiEdits }
  const subjectName = selected ?? preview?.subjectNames[0] ?? ''

  const handleSave = async () => {
    if (!preview) return

    let id = reportId
    setSaving(true)
    try {
      if (!id) {
        id = await reportSingleApi.create({
          studentId,
          examId,
          examIds: preview.examIds,
          subjectNames: preview.subjectNames,
          ...(teacherFeedback.trim() && { teacherFeedback: teacherFeedback.trim() }),
          aiFeedback: preview.subscribed ? aiFeedback : null,
        })
        setReportId(id)
      }
      setShareLink(await reportSingleApi.createShareLink(id))
      toast.success('리포트가 저장되었습니다.')
    } catch (e) {
      toast.error(
        getErrorMessage(
          e,
          id
            ? '리포트는 저장되었지만 공유 링크를 만들지 못했습니다. 다시 눌러 주세요.'
            : '리포트를 저장하지 못했습니다.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  const footer = shareLink ? (
    <Button type="button" onClick={onClose}>
      닫기
    </Button>
  ) : preview ? (
    <div className="flex w-full flex-col items-end gap-1">
      <Button type="button" onClick={handleSave} disabled={saving}>
        공유 링크 생성 후 저장
      </Button>
      <p className="text-xs text-muted-foreground">저장하면 공유 링크가 만들어집니다.</p>
    </div>
  ) : undefined

  return (
    <SlidePanel
      open
      onOpenChange={(open) => !open && onClose()}
      title={preview ? `${preview.studentName} 리포트 미리보기` : '리포트 미리보기'}
      description={preview?.className ?? undefined}
      footer={footer}
      confirmOnClose={
        reportId
          ? undefined
          : {
              title: '저장하지 않고 나갈까요?',
              description: '저장하지 않고 나가면 리포트는 사라집니다.',
            }
      }
    >
      {loading && (
        <div className="flex flex-col gap-4" aria-busy>
          <p className="text-sm text-muted-foreground">
            리포트를 만드는 중입니다. AI 피드백 생성에 시간이 걸릴 수 있어요.
          </p>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!loading && (error || !preview) && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">{error ?? '리포트를 만들지 못했습니다.'}</p>
          <Button type="button" variant="outline" size="sm" onClick={refetch}>
            다시 시도
          </Button>
        </div>
      )}

      {preview && shareLink && <SavedView link={shareLink} />}

      {preview && !shareLink && (
        <Draft
          preview={preview}
          subjectName={subjectName}
          onSubjectChange={setSelected}
          teacherFeedback={teacherFeedback}
          onTeacherFeedbackChange={setTeacherFeedback}
          aiFeedback={aiFeedback}
          onAiFeedbackChange={(name, value) =>
            setAiEdits((current) => ({ ...current, [name]: value }))
          }
        />
      )}
    </SlidePanel>
  )
}

interface DraftProps {
  preview: SingleReportPreview
  subjectName: string
  onSubjectChange: (name: string) => void
  teacherFeedback: string
  onTeacherFeedbackChange: (value: string) => void
  aiFeedback: Record<string, string>
  onAiFeedbackChange: (subjectName: string, value: string) => void
}

function Draft({
  preview,
  subjectName,
  onSubjectChange,
  teacherFeedback,
  onTeacherFeedbackChange,
  aiFeedback,
  onAiFeedbackChange,
}: DraftProps) {
  const stat = preview.subjectStats[subjectName]
  const compare = stat?.personalVsExamAverage

  const trend = (stat?.recent10 ?? []).map((point) => ({
    label: formatShortDate(point.examDate),
    personal: point.score,
  }))

  const subjectItems = preview.subjectNames.map((name) => ({ value: name, label: name }))

  return (
    <div className="flex flex-col gap-6">
      <ResultsTableView preview={preview} />

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">과목 선택</span>
        <Select
          items={subjectItems}
          value={subjectName}
          onValueChange={(value) => value && onSubjectChange(value as string)}
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

      {compare && (
        <ScoreCompareChart
          title={`${subjectName} 개인 점수 vs 시험 평균`}
          data={[{ subject: subjectName, personal: compare.score, average: compare.examAverage }]}
        />
      )}
      <ScoreTrendChart title="최근 10회 점수 추이" data={trend} series={['personal']} />

      <AiFeedbackSection
        subscribed={preview.subscribed}
        subjectName={subjectName}
        subjectFeedback={aiFeedback[subjectName] ?? ''}
        overallFeedback={preview.aiOverallFeedback}
        onSubjectFeedbackChange={(value) => onAiFeedbackChange(subjectName, value)}
      />

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">선생님 피드백</h3>
        <Textarea
          rows={5}
          value={teacherFeedback}
          onChange={(event) => onTeacherFeedbackChange(event.target.value)}
          placeholder="직접 작성하거나 AI 피드백을 참고해 작성하세요."
          aria-label="선생님 피드백"
        />
        <p className="text-xs text-muted-foreground">
          지금 저장하면 링크 만료 예정: {formatFullDate(preview.linkExpiresAt)}
        </p>
      </div>
    </div>
  )
}

function ResultsTableView({ preview }: { preview: SingleReportPreview }) {
  const { rows, total } = preview.resultsTable
  const isGrade = rows.some((row) => row.gradeLabel !== null)
  const hasMax = rows.some((row) => row.maxScore !== null)

  const scoreText = (row: (typeof rows)[number]) => {
    if (isGrade) return row.gradeLabel ?? '-'
    if (row.score === null) return '-'
    return hasMax && row.maxScore !== null
      ? `${formatScore(row.score)}/${formatScore(row.maxScore)}`
      : formatScore(row.score)
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">시험 결과표</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>과목</TableHead>
            <TableHead className="text-right">
              {isGrade ? '등급' : hasMax ? '점수/만점' : '점수'}
            </TableHead>
            {!isGrade && <TableHead className="text-right">반평균</TableHead>}
            {!isGrade && <TableHead className="text-right">과목석차</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.subjectName}>
              <TableCell className="font-medium">{row.subjectName}</TableCell>
              <TableCell className="text-right tabular-nums">{scoreText(row)}</TableCell>
              {!isGrade && (
                <TableCell className="text-right tabular-nums">
                  {formatScore(row.classAverage)}
                </TableCell>
              )}
              {!isGrade && (
                <TableCell className="text-right tabular-nums">{row.subjectRank ?? '-'}</TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
        {!isGrade && (
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold">종합</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {total.score === null
                  ? '-'
                  : hasMax && total.maxScoreTotal !== null
                    ? `${formatScore(total.score)}/${formatScore(total.maxScoreTotal)}`
                    : formatScore(total.score)}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatScore(total.classAverage)}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {total.rank ?? '-'}
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </section>
  )
}

// 저장 완료 화면. TODO: SendSingleModal(API 36) 연결 후 이 화면 대신 발송창을 연다.
function SavedView({ link }: { link: ShareLink }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(link.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold">리포트가 저장되었습니다</h3>
        <p className="text-sm text-muted-foreground">
          공유 링크 만료: {formatFullDate(link.expiresAt)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={link.url}
          aria-label="공유 링크"
          className="h-9 min-w-0 flex-1 rounded-md border bg-muted/40 px-3 text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? <Check /> : <Copy />}
          링크 복사
        </Button>
      </div>
    </div>
  )
}
