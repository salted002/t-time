import { useState } from 'react'

import { InfoGrid } from '@/components/common/InfoGrid'
import { SectionCard } from '@/components/common/SectionCard'
import { ProfileDropdown } from '@/components/layout/ProfileDropdown'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/hooks/useConfirm'

export function Stage4Demo() {
  const confirm = useConfirm()
  const [log, setLog] = useState('아직 없음')

  const handleDelete = async () => {
    const ok = await confirm({
      title: '학생을 삭제할까요?',
      description: '휴원·퇴원과 달리 학생 정보가 완전히 삭제되며 되돌릴 수 없어요.',
      confirmLabel: '삭제하기',
      tone: 'destructive',
    })
    setLog(ok ? '삭제 확인' : '취소')
  }

  const handleStatusChange = async () => {
    const ok = await confirm({
      title: '상태를 휴원으로 바꿀까요?',
      description: '휴원·퇴원 학생은 이후 생성되는 시험의 응시인원에서 제외됩니다.',
      confirmLabel: '변경',
    })
    setLog(ok ? '변경 확인' : '취소')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDelete}>
            삭제 확인창
          </Button>
          <Button variant="outline" onClick={handleStatusChange}>
            일반 확인창
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">결과: {log}</p>
      </div>

      <SectionCard
        title="시험 정보"
        actions={
          <Button variant="outline" size="sm">
            시험 정보 수정
          </Button>
        }
      >
        <InfoGrid
          items={[
            { label: '시험일자', value: '2025.09.01' },
            { label: '응시반', value: 'A반' },
            { label: '평가방식', value: '점수형(만점)' },
            { label: '시험과목', value: '5개' },
            { label: '만점값', value: '각 20~25' },
            { label: '등급목록', value: null },
            {
              label: '내부공유용 메모',
              value: '이번 시험은 범위가 넓어서\n평균이 낮을 수 있음',
              span: 3,
            },
          ]}
        />
      </SectionCard>

      <div className="flex items-center gap-3">
        <span className="text-sm">프로필 드롭다운 →</span>
        <ProfileDropdown
          name="김선주"
          email="sunju@hanbit.kr"
          onLogout={() => setLog('로그아웃 클릭')}
        />
      </div>
    </div>
  )
}
