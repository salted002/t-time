import { useState } from 'react'
import { toast } from 'sonner'
import { CreditCard, Check, Minus, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/templates/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { subscriptionApi } from '@/api/subscriptionApi'
import { useAuthMe } from '@/hooks/useAuthMe'
import { useConfirm } from '@/hooks/useConfirm'
import { useSubscription } from '@/hooks/useSubscription'
import { getErrorMessage } from '@/lib/errors'
import { formatCreatedDate } from '@/lib/format'
import { PLAN_COMPARE, PLAN_INFO } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { PAGE_TEXT } from '@/lib/pageText'

// 구독관리페이지 (SCR-SUBSCRIPTION)
export default function SubscriptionPage() {
  const confirm = useConfirm()
  const { data, loading, error, refetch } = useSubscription()
  const { refetch: refetchMe } = useAuthMe()
  const [submitting, setSubmitting] = useState(false)

  const subscribed = data?.subscription.status === 'SUBSCRIBED'

  const handleToggle = async () => {
    const ok = await confirm(
      subscribed
        ? {
            title: '구독을 취소할까요?',
            description:
              '취소하면 AI 피드백이 다시 잠깁니다. 저장된 AI 피드백은 지워지지 않고, 다시 구독하면 볼 수 있습니다.',
            confirmLabel: '구독 취소',
            tone: 'destructive',
          }
        : {
            title: `${PLAN_INFO.SUBSCRIBED.name}를 구독할까요?`,
            description: 'AI 피드백(시험/통계/리포트) 잠금이 해제됩니다. 결제는 진행되지 않습니다.',
            confirmLabel: '구독하기',
          },
    )
    if (!ok) return

    setSubmitting(true)
    try {
      if (subscribed) {
        await subscriptionApi.cancel()
        toast.success('구독이 취소되었습니다.')
      } else {
        await subscriptionApi.subscribe('SUBSCRIBED')
        toast.success('구독이 시작되었습니다.')
      }
      refetch()
      refetchMe()
    } catch (e) {
      toast.error(getErrorMessage(e, '구독 상태를 변경하지 못했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <PageHeader title="구독 관리" icon={CreditCard} {...PAGE_TEXT.SUBSCRIPTION} />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading || !data ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <>
          <div className="grid items-stretch gap-5 sm:grid-cols-2">
            {/* FREE */}
            <section
              className={cn(
                'flex flex-col rounded-xl bg-card p-7 transition-shadow hover:shadow-md',
                !subscribed ? 'border-2 border-primary shadow-md' : 'border',
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-wide">{PLAN_INFO.FREE.name}</h2>
                {!subscribed && <Badge variant="success">현재 플랜</Badge>}
              </div>
              <p className="mt-5 text-4xl font-extrabold">{PLAN_INFO.FREE.price}</p>
              <p className="mt-2 text-[13px] text-muted-foreground">{PLAN_INFO.FREE.tagline}</p>
              <ul className="mt-6 flex flex-1 flex-col gap-3.5 border-t pt-5 text-sm">
                <Feature>기본 성적 관리</Feature>
                <Feature>SMS 발송</Feature>
              </ul>
              {!subscribed && (
                <Button type="button" variant="outline" size="lg" className="mt-7 w-full" disabled>
                  사용 중
                </Button>
              )}
            </section>

            {/* AI PRO */}
            <section
              className={cn(
                'flex flex-col rounded-xl bg-card p-7 transition-shadow hover:shadow-md',
                subscribed ? 'border-2 border-primary shadow-md' : 'border',
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-wide text-primary">
                  {PLAN_INFO.SUBSCRIBED.name}
                </h2>
                {subscribed ? (
                  <Badge variant="success">현재 플랜</Badge>
                ) : (
                  <Badge variant="warning">추천</Badge>
                )}
              </div>
              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold">{PLAN_INFO.SUBSCRIBED.price}</span>
                <span className="text-sm text-muted-foreground">
                  {PLAN_INFO.SUBSCRIBED.priceUnit}
                </span>
              </p>
              <p className="mt-2 text-[13px] text-muted-foreground">
                {PLAN_INFO.SUBSCRIBED.tagline}
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-3.5 border-t pt-5 text-sm">
                <Feature muted>FREE의 모든 기능</Feature>
                <Feature ai>AI 피드백 잠금 해제</Feature>
                <Feature ai>시험/통계/리포트 AI 분석</Feature>
              </ul>
              {subscribed && data.subscription.subscribedAt && (
                <p className="mt-5 text-center text-xs text-muted-foreground">
                  {formatCreatedDate(data.subscription.subscribedAt)}부터 구독 중
                </p>
              )}
              <Button
                type="button"
                variant={subscribed ? 'outline' : 'default'}
                size="lg"
                className={cn('w-full', subscribed ? 'mt-2' : 'mt-7')}
                disabled={submitting}
                onClick={handleToggle}
              >
                {subscribed ? '구독 취소' : '구독하기'}
              </Button>
              <p className="mt-2.5 text-center text-xs text-muted-foreground">
                결제 연동 없이 바로 켜고 끌 수 있어요.
              </p>
            </section>
          </div>

          {/* 플랜 비교 */}
          <section className="mt-8 overflow-hidden rounded-lg border bg-card">
            <h2 className="border-b px-6 py-4 text-base font-semibold">플랜 비교</h2>
            <div className="overflow-x-auto">
              <div className="grid min-w-120 grid-cols-[2fr_1fr_1fr] text-sm">
                <div className="bg-muted px-6 py-3 text-xs font-semibold text-muted-foreground">
                  기능
                </div>
                <div className="bg-muted px-6 py-3 text-center text-xs font-semibold text-muted-foreground">
                  {PLAN_INFO.FREE.name}
                </div>
                <div className="bg-muted px-6 py-3 text-center text-xs font-bold text-primary">
                  {PLAN_INFO.SUBSCRIBED.name}
                </div>
                {PLAN_COMPARE.map((row) => (
                  <CompareRow key={row.name} {...row} />
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function Feature({ children, ai, muted }: { children: string; ai?: boolean; muted?: boolean }) {
  return (
    <li
      className={cn(
        'flex items-center gap-2.5',
        muted && 'text-muted-foreground',
        ai && 'font-semibold',
      )}
    >
      {ai ? (
        <Sparkles className="size-4.5 text-chart-2" />
      ) : (
        <Check className="size-4.5 text-primary" />
      )}
      {children}
    </li>
  )
}

function CompareRow({ name, free, pro }: { name: string; free: boolean; pro: boolean }) {
  return (
    <>
      <div className="border-t px-6 py-3.5">{name}</div>
      <div className="flex justify-center border-t px-6 py-3.5">
        {free ? (
          <Check className="size-4 text-primary" />
        ) : (
          <Minus className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex justify-center border-t px-6 py-3.5">
        {pro ? (
          <Check className="size-4 text-primary" />
        ) : (
          <Minus className="size-4 text-muted-foreground" />
        )}
      </div>
    </>
  )
}
