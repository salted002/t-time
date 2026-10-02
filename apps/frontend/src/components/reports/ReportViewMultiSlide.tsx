import { useState } from 'react'
import { SlidePanel } from '@/components/common/SlidePanel'
import { ScoreTrendChart } from '@/components/charts/ScoreTrendChart'
import { AiFeedbackSection } from '@/components/reports/AiFeedbackSection'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { PreviewItem } from '@/hooks/usePreviewQueue'
import { formatFullDate, formatShortDate } from '@/lib/format'

interface ReportViewMultiSlideProps {
  item: PreviewItem | null // null이면 닫힘
  onClose: () => void
  onTeacherFeedbackChange: (studentId: string, value: string) => void
  onAiFeedbackChange: (studentId: string, subjectName: string, value: string) => void
}

// 리포트미리보기슬라이드_복수 (SCR-REPORT-VIEW-MULTI)
export function ReportViewMultiSlide({
  item,
  onClose,
  onTeacherFeedbackChange,
  onAiFeedbackChange,
}: ReportViewMultiSlideProps) {
  // 선택한 과목 (학생이 바뀌면 첫 과목부터 보이도록 학생별로 기억한다)
  const [selectedByStudent, setSelectedByStudent] = useState<Record<string, string>>({})

  const preview = item?.preview ?? null

  return (
    <SlidePanel
      open={item !== null}
      onOpenChange={(open) => !open && onClose()}
      title={item ? `${item.studentName} 리포트` : '리포트 미리보기'}
      description={preview?.className ?? undefined}
    >
      {item && preview && (
        <Body
          item={item}
          subjectName={selectedByStudent[item.studentId] ?? preview.subjectNames[0]}
          onSubjectChange={(name) =>
            setSelectedByStudent((current) => ({ ...current, [item.studentId]: name }))
          }
          onTeacherFeedbackChange={onTeacherFeedbackChange}
          onAiFeedbackChange={onAiFeedbackChange}
        />
      )}
    </SlidePanel>
  )
}

interface BodyProps {
  item: PreviewItem
  subjectName: string
  onSubjectChange: (name: string) => void
  onTeacherFeedbackChange: (studentId: string, value: string) => void
  onAiFeedbackChange: (studentId: string, subjectName: string, value: string) => void
}

function Body({
  item,
  subjectName,
  onSubjectChange,
  onTeacherFeedbackChange,
  onAiFeedbackChange,
}: BodyProps) {
  const preview = item.preview!
  const stat = preview.subjectStats[subjectName]

  // 시험(examId) 기준으로 개인 점수와 반 평균을 한 줄로 합친다.
  const averageByExam = new Map(
    (stat?.classAverageRecent10 ?? []).map((point) => [point.examId, point.average]),
  )
  const trend = (stat?.recent10 ?? []).map((point) => ({
    label: formatShortDate(point.examDate),
    personal: point.score,
    average: averageByExam.get(point.examId) ?? null,
  }))

  const subjectItems = preview.subjectNames.map((name) => ({ value: name, label: name }))

  return (
    <div className="flex flex-col gap-6">
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

      <ScoreTrendChart title="최근 10회 점수 추이" data={trend} series={['personal']} />
      <ScoreTrendChart
        title="같은 반 평균 대비 10회 추이"
        data={trend}
        series={['personal', 'average']}
      />

      <AiFeedbackSection
        subscribed={preview.subscribed}
        subjectName={subjectName}
        subjectFeedback={item.aiFeedback?.[subjectName] ?? ''}
        overallFeedback={preview.aiOverallFeedback}
        onSubjectFeedbackChange={(value) => onAiFeedbackChange(item.studentId, subjectName, value)}
      />

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">선생님 피드백</h3>
        <Textarea
          rows={5}
          value={item.teacherFeedback}
          onChange={(event) => onTeacherFeedbackChange(item.studentId, event.target.value)}
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
