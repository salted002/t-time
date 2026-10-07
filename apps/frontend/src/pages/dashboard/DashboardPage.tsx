import type { ComponentType, ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LayoutDashboard, Clock, FileText, Plus, ScrollText, Sparkles, Users } from 'lucide-react'
import { PageHeader } from '@/components/templates/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useAuthMe } from '@/hooks/useAuthMe'
import { useDashboard } from '@/hooks/useDashboard'
import { formatCreatedDateTime, formatDate } from '@/lib/format'
import { PAGE_TEXT } from '@/lib/pageText'
import { cn } from '@/lib/utils'

// 대시보드페이지 (SCR-DASHBOARD)
export default function DashboardPage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { user } = useAuth()
  const { me } = useAuthMe()
  const { data, loading, error } = useDashboard()

  const userName = user?.name ?? '관리자'
  const isFree = me?.academy.subscriptionStatus !== 'SUBSCRIBED'

  return (
    <div>
      <PageHeader
        title={`안녕하세요, ${userName} 님`}
        icon={LayoutDashboard}
        {...PAGE_TEXT.DASHBOARD}
        description={
          me?.academy.name ? `${me.academy.name}의 현황을 한눈에 확인하세요.` : undefined
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/${slug}/students/new`)}
            >
              <Plus />
              학생 등록
            </Button>
            <Button type="button" onClick={() => navigate(`/${slug}/exams/new`)}>
              <Plus />
              시험 추가
            </Button>
          </>
        }
      />

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !data ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : (
          <>
            <StatCard
              label="재원 학생"
              value={data.studentCount.active}
              unit="명"
              note={`전체 ${data.studentCount.total}명 중`}
              icon={Users}
              tone="success"
            />
            <StatCard
              label="휴원 학생"
              value={data.studentCount.onLeave}
              unit="명"
              note={`전체 ${data.studentCount.total}명 중`}
              icon={Clock}
              tone="warning"
            />
            <StatCard
              label="전체 시험"
              value={data.examCount}
              unit="건"
              note="등록된 시험"
              icon={FileText}
              tone="info"
            />
            <StatCard
              label="저장된 리포트"
              value={data.reportCount}
              unit="건"
              note="리포트 관리에서 확인"
              icon={ScrollText}
              tone="muted"
            />
          </>
        )}
      </div>

      {/* 최근 시험 · 최근 발송 이력 */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ListSection
          title="최근 시험"
          moreTo={`/${slug}/exams`}
          loading={loading}
          empty="등록된 시험이 없습니다."
        >
          {data?.recentExams.map((exam) => (
            <ListRow
              key={exam.id}
              onClick={() => navigate(`/${slug}/exams/${exam.id}`)}
              title={exam.name}
              meta={`${formatDate(exam.examDate)} · ${exam.className ?? '(반 없음)'}`}
              right={
                <span className="text-sm text-muted-foreground">
                  응시 {exam.participantCount}명
                </span>
              }
            />
          ))}
        </ListSection>

        <ListSection
          title="최근 발송 이력"
          moreTo={`/${slug}/message-logs`}
          loading={loading}
          empty="발송 이력이 없습니다."
        >
          {data?.recentMessageLogs.map((log) => (
            <ListRow
              key={log.id}
              onClick={() => navigate(`/${slug}/message-logs`)}
              title={log.studentName}
              meta={`${log.messagePreview} · ${formatCreatedDateTime(log.sentAt)}`}
              right={
                <StatusBadge tone={log.status === '성공' ? 'success' : 'destructive'}>
                  {log.status}
                </StatusBadge>
              }
            />
          ))}
        </ListSection>
      </div>

      {/* 구독 안내 (FREE 플랜만) */}
      {isFree && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-brand-soft bg-brand-soft p-5">
          <div className="flex items-center gap-3.5">
            <span className="flex size-10 items-center justify-center rounded-lg bg-card text-chart-2">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-[15px] font-bold text-brand">
                AI 피드백으로 리포트 작성 시간을 줄여보세요
              </p>
              <p className="mt-0.5 text-[13px] text-brand-soft-foreground">
                구독하면 AI 피드백과 시험/통계/리포트 AI 분석을 사용할 수 있어요.
              </p>
            </div>
          </div>
          <Button type="button" onClick={() => navigate(`/${slug}/subscription`)}>
            요금제 보기
          </Button>
        </div>
      )}
    </div>
  )
}

const TONE_CLASS = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
  muted: 'bg-muted text-muted-foreground',
} as const

interface StatCardProps {
  label: string
  value: number
  unit: string
  note: string
  icon: ComponentType<{ className?: string }>
  tone: keyof typeof TONE_CLASS
}

function StatCard({ label, value, unit, note, icon: Icon, tone }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <span
          className={cn('flex size-9 items-center justify-center rounded-lg', TONE_CLASS[tone])}
        >
          <Icon className="size-4.5" />
        </span>
      </div>
      <p className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold tracking-tight">{value.toLocaleString()}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  )
}

interface ListSectionProps {
  title: string
  moreTo: string
  loading: boolean
  empty: string
  children: ReactNode
}

function ListSection({ title, moreTo, loading, empty, children }: ListSectionProps) {
  const navigate = useNavigate()
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children)

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <button
          type="button"
          onClick={() => navigate(moreTo)}
          className="text-[13px] font-semibold text-primary hover:underline"
        >
          전체 보기
        </button>
      </div>
      {loading ? (
        <Skeleton className="m-6 mt-0 h-24" />
      ) : hasRows ? (
        <ul>{children}</ul>
      ) : (
        <p className="border-t px-6 py-8 text-center text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  )
}

interface ListRowProps {
  title: string
  meta: string
  right: ReactNode
  onClick: () => void
}

function ListRow({ title, meta, right, onClick }: ListRowProps) {
  return (
    <li className="border-t">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 px-6 py-3.5 text-left transition-colors hover:bg-background"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{title}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{meta}</span>
        </span>
        <span className="shrink-0">{right}</span>
      </button>
    </li>
  )
}
