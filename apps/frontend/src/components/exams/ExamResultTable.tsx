import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatScore } from '@/lib/format'
import type { ExamDetail } from '@/types/exam'

interface ExamResultTableProps {
  exam: ExamDetail
}

// 1~3등 메달 색 (시안 7번). 석차 문자열 '2/24'의 앞 숫자를 쓴다.
const MEDAL_CLASS: Record<number, string> = {
  1: 'bg-sidebar-primary text-white',
  2: 'bg-neutral-400 text-white',
  3: 'bg-amber-700 text-white',
}

function RankBadge({ totalRank }: { totalRank: string | null }) {
  if (!totalRank) return <span className="text-muted-foreground">-</span>
  const rank = Number(totalRank.split('/')[0])
  const medal = MEDAL_CLASS[rank]

  return medal ? (
    <span
      title={totalRank}
      className={cn(
        'inline-flex size-6 items-center justify-center rounded-full text-xs font-bold',
        medal,
      )}
    >
      {rank}
    </span>
  ) : (
    <span className="font-medium">{totalRank}</span>
  )
}

// 시험 상세 결과표 (SCR-EXAM-DETAIL 섹션2)
// 점수형: 과목별 점수(과목석차) | 총점 | 석차 | 피드백 + 반평균 행 / 등급형: 과목별 등급 | 피드백
export function ExamResultTable({ exam }: ExamResultTableProps) {
  const isGrade = exam.evalType === 'grade'

  const gradeLabelById = new Map(exam.grades.map((grade) => [grade.id, grade.label]))
  const averageBySubjectId = new Map(
    (exam.classAverage?.bySubject ?? []).map((item) => [item.subjectId, item.average]),
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>학생명</TableHead>
          {exam.subjects.map((subject) => (
            <TableHead key={subject.id} className="text-right">
              {subject.name}
              {subject.maxScore !== null && (
                <span className="font-normal text-muted-foreground">
                  {' '}
                  ({formatScore(subject.maxScore)})
                </span>
              )}
            </TableHead>
          ))}
          {!isGrade && <TableHead className="text-right">총점</TableHead>}
          {!isGrade && <TableHead className="text-center">석차</TableHead>}
          <TableHead className="text-center">선생님 피드백</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {exam.participants.map((participant) => {
          // 점수형인데 총점이 없으면 아무 점수도 입력되지 않은 미응시
          const absent = !isGrade && participant.total === null

          return (
            <TableRow key={participant.participantId}>
              <TableCell className={cn('font-medium', absent && 'text-muted-foreground')}>
                {participant.studentName}
              </TableCell>

              {exam.subjects.map((subject) => {
                const cell = participant.scores.find((score) => score.subjectId === subject.id)
                const rank = participant.subjectRanks.find(
                  (item) => item.subjectId === subject.id,
                )?.rank

                return (
                  <TableCell key={subject.id} className="text-right tabular-nums">
                    {isGrade ? (
                      ((cell?.gradeId && gradeLabelById.get(cell.gradeId)) ?? '-')
                    ) : absent ? (
                      <span className="text-muted-foreground">--</span>
                    ) : (
                      <>
                        {formatScore(cell?.score ?? null)}
                        {rank && <div className="text-xs text-muted-foreground">{rank}</div>}
                      </>
                    )}
                  </TableCell>
                )
              })}

              {!isGrade && (
                <TableCell className="text-right font-bold tabular-nums">
                  {absent ? (
                    <span className="text-muted-foreground">--</span>
                  ) : (
                    formatScore(participant.total)
                  )}
                </TableCell>
              )}
              {!isGrade && (
                <TableCell className="text-center tabular-nums">
                  {absent ? (
                    <Badge variant="secondary">미응시</Badge>
                  ) : (
                    <RankBadge totalRank={participant.totalRank} />
                  )}
                </TableCell>
              )}

              <TableCell className="text-center">
                {participant.teacherComment ? (
                  <Popover>
                    <PopoverTrigger className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline">
                      보기
                      <ChevronRight className="size-3" />
                    </PopoverTrigger>
                    <PopoverContent className="whitespace-pre-wrap" align="end">
                      {participant.teacherComment}
                    </PopoverContent>
                  </Popover>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>

      {!isGrade && exam.classAverage && (
        <TableFooter className="border-t-2 bg-muted/60 font-bold">
          <TableRow>
            <TableCell className="text-primary">반평균</TableCell>
            {exam.subjects.map((subject) => (
              <TableCell key={subject.id} className="text-right tabular-nums">
                {formatScore(averageBySubjectId.get(subject.id) ?? null)}
              </TableCell>
            ))}
            <TableCell className="text-right tabular-nums">
              {formatScore(exam.classAverage.total)}
            </TableCell>
            <TableCell />
            <TableCell />
          </TableRow>
        </TableFooter>
      )}
    </Table>
  )
}
