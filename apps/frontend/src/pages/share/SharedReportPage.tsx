import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ScoreTrendChart } from '@/components/charts/ScoreTrendChart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { shareApi } from '@/api/shareApi'
import { useFetch } from '@/hooks/useFetch'
import { formatFullDate, formatShortDate } from '@/lib/format'
import type { SharedReport } from '@/types/share'

// 학부모 공유 리포트(SCR-SHARE-REPORT). 로그인 없이 접근하며 사이드바/헤더가 없다.
export default function SharedReportPage() {
  const { token } = useParams<{ token: string }>()
  const { data, error, loading, refetch } = useFetch(token ?? null, (signal) =>
    shareApi.get(token ?? '', signal),
  )

  if (loading) {
    return (
      <Shell>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <Notice
          message="리포트를 불러오지 못했습니다."
          action={
            <button type="button" className="text-sm underline" onClick={refetch}>
              다시 시도
            </button>
          }
        />
      </Shell>
    )
  }

  if (!data || !data.ok) {
    const expired = data?.reason === 'expired'
    return (
      <Shell>
        <Notice
          message={
            expired ? '링크가 만료되었습니다. 학원에 문의해 주세요.' : '존재하지 않는 리포트입니다.'
          }
        />
      </Shell>
    )
  }

  return (
    <Shell>
      <ReportBody report={data.report} />
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-muted/30">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-8">{children}</main>
    </div>
  )
}

function Notice({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border bg-card p-10 text-center"
    >
      <p className="text-sm">{message}</p>
      {action}
    </div>
  )
}

function ReportBody({ report }: { report: SharedReport }) {
  const [selected, setSelected] = useState(report.subjectNames[0] ?? '')
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
  const teacherFeedback = report.teacherFeedback?.trim()

  return (
    <>
      <header className="flex flex-col items-center gap-2 text-center">
        {report.academyLogoUrl && (
          <img
            src={report.academyLogoUrl}
            alt={`${report.academyName} 로고`}
            className="h-12 w-auto object-contain"
          />
        )}
        <p className="text-sm text-muted-foreground">{report.academyName}</p>
        <h1 className="text-xl font-bold">{report.studentName} 학생 성적 리포트</h1>
      </header>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">과목 선택</span>
        <Select
          items={subjectItems}
          value={subjectName}
          onValueChange={(value) => value && setSelected(value as string)}
        >
          <SelectTrigger className="flex-1" aria-label="과목 선택">
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

      <ScoreTrendChart title="최근 10회 점수 추이" data={trend} series={['personal']} />
      <ScoreTrendChart
        title="같은 반 평균 대비 10회 추이"
        data={trend}
        series={['personal', 'average']}
      />

      {aiComment && (
        <section className="flex flex-col gap-2 rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">AI 과목별 코멘트 · {subjectName}</h2>
          <p className="text-sm whitespace-pre-wrap">{aiComment}</p>
        </section>
      )}

      {teacherFeedback && (
        <section className="flex flex-col gap-2 rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">선생님 피드백</h2>
          <p className="text-sm whitespace-pre-wrap">{teacherFeedback}</p>
        </section>
      )}

      <footer className="text-center text-xs text-muted-foreground">
        링크 만료: {formatFullDate(report.expiresAt)}
      </footer>
    </>
  )
}
