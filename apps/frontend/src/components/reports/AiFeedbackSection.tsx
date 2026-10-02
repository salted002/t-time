import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { LockedFeatureOverlay } from '@/components/common/LockedFeatureOverlay'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface AiFeedbackSectionProps {
  subscribed: boolean
  subjectName: string
  subjectFeedback: string
  overallFeedback: string | null
  onSubjectFeedbackChange: (value: string) => void
}

// AI 과목별 피드백(수정 가능, 리포트에 포함) + AI 시험 전체 피드백(복사용, 리포트에 미포함)
export function AiFeedbackSection({
  subscribed,
  subjectName,
  subjectFeedback,
  overallFeedback,
  onSubjectFeedbackChange,
}: AiFeedbackSectionProps) {
  const [copied, setCopied] = useState(false)

  const copyOverall = async () => {
    if (!overallFeedback) return
    await navigator.clipboard.writeText(overallFeedback)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <LockedFeatureOverlay
      locked={!subscribed}
      title="구독 전용 기능이에요"
      description="구독하면 AI가 과목별 피드백과 시험 전체 피드백 초안을 만들어 줍니다. (학부모 발송본에는 노출되지 않아요)"
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">AI 과목별 피드백 · {subjectName}</h3>
          <Textarea
            rows={4}
            value={subjectFeedback}
            onChange={(event) => onSubjectFeedbackChange(event.target.value)}
            placeholder="AI 피드백이 없습니다."
            aria-label={`${subjectName} AI 과목별 피드백`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">AI 시험 전체 피드백</h3>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={copyOverall}
              disabled={!overallFeedback}
            >
              {copied ? <Check /> : <Copy />}
              복사하기
            </Button>
          </div>
          <p className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap">
            {overallFeedback ?? 'AI 피드백이 없습니다.'}
          </p>
          <p className="text-xs text-muted-foreground">
            선생님 참고용이며 리포트에 포함되지 않습니다.
          </p>
        </div>
      </div>
    </LockedFeatureOverlay>
  )
}
