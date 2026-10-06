import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/templates/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { subscriptionApi } from '@/api/subscriptionApi'
import { useConfirm } from '@/hooks/useConfirm'
import { useSubscription } from '@/hooks/useSubscription'
import { getErrorMessage } from '@/lib/errors'
import { formatCreatedDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PAGE_TEXT } from '@/lib/pageText'

// 구독관리페이지 (SCR-SUBSCRIPTION)
export default function SubscriptionPage() {
  const confirm = useConfirm()
  const { data, loading, error, refetch } = useSubscription()
  const [submitting, setSubmitting] = useState(false)

  const status = data?.subscription.status
  const subscribed = status === 'SUBSCRIBED'

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
            title: '구독할까요?',
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
    } catch (e) {
      toast.error(getErrorMessage(e, '구독 상태를 변경하지 못했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="구독 관리" {...PAGE_TEXT.SUBSCRIPTION} />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
        {loading &&
          Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-48 w-full" />)}

        {data?.plans.map((plan) => {
          const isCurrent = plan.id === status
          return (
            <div
              key={plan.id}
              className={cn(
                'flex flex-col gap-3 rounded-lg border bg-card p-6 transition-colors hover:border-primary',
                isCurrent && 'border-primary',
              )}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                {isCurrent && <Badge variant="success">현재 플랜</Badge>}
              </div>

              <p className="flex-1 text-sm text-muted-foreground">
                {plan.description ?? '기본 기능을 무료로 사용합니다.'}
              </p>

              {plan.id === 'SUBSCRIBED' && (
                <>
                  {subscribed && data.subscription.subscribedAt && (
                    <p className="text-xs text-muted-foreground">
                      {formatCreatedDate(data.subscription.subscribedAt)}부터 구독 중
                    </p>
                  )}
                  <Button
                    type="button"
                    variant={subscribed ? 'outline' : 'default'}
                    disabled={submitting}
                    onClick={handleToggle}
                  >
                    {subscribed ? '구독 취소' : '구독하기'}
                  </Button>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
