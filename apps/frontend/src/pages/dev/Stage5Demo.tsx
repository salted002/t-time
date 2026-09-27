import { useState } from 'react'

import { ChipList, type ChipItem } from '@/components/common/ChipList'
import { LockedFeatureOverlay } from '@/components/common/LockedFeatureOverlay'
import { SlidePanel } from '@/components/common/SlidePanel'
import { Stepper } from '@/components/common/Stepper'
import { Button } from '@/components/ui/button'

const INITIAL_SUBJECTS: ChipItem[] = [
  { id: '1', label: '문법' },
  { id: '2', label: 'Reading' },
  { id: '3', label: 'Listening' },
]

export function Stage5Demo() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [subjects, setSubjects] = useState(INITIAL_SUBJECTS)

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Button onClick={() => setPanelOpen(true)}>리포트 미리보기 슬라이드 열기</Button>
        <SlidePanel
          open={panelOpen}
          onOpenChange={setPanelOpen}
          title="리포트 미리보기"
          confirmOnClose={{
            title: '저장하지 않고 나갈까요?',
            description: '저장하지 않고 나가면 리포트는 사라집니다.',
          }}
          footer={<Button className="ml-auto">공유 링크 생성 후 저장</Button>}
        >
          <div className="space-y-4">
            <p className="text-sm">본문이 길어지면 이 영역만 스크롤돼요.</p>
            <LockedFeatureOverlay
              locked
              title="AI 과목별 피드백"
              description="구독하면 AI가 과목별 피드백을 자동으로 작성해 드려요."
              action={
                <Button size="sm" variant="outline">
                  구독 관리로
                </Button>
              }
            >
              <div className="space-y-2 p-4 text-sm">
                <p>문법: 관계대명사 활용이 안정적이며…</p>
                <p>Reading: 추론 문제에서 근거를 찾는 연습이…</p>
              </div>
            </LockedFeatureOverlay>
          </div>
        </SlidePanel>
      </div>

      <div className="space-y-3">
        <Stepper steps={['학원 정보', '계정 정보', '완료']} current={step} />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            이전
          </Button>
          <Button size="sm" disabled={step === 2} onClick={() => setStep((s) => s + 1)}>
            다음
          </Button>
        </div>
      </div>

      <ChipList
        items={subjects}
        onRemove={(id) => setSubjects((prev) => prev.filter((s) => s.id !== id))}
      >
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-dashed"
          disabled={subjects.length >= 7}
          onClick={() =>
            setSubjects((prev) => [
              ...prev,
              { id: crypto.randomUUID(), label: `과목${prev.length + 1}` },
            ])
          }
        >
          + 추가
        </Button>
      </ChipList>
    </div>
  )
}
