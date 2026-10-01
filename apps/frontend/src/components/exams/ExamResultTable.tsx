import { ChevronRight } from 'lucide-react'
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
import { formatScore } from '@/lib/format'
import type { ExamDetail } from '@/types/exam'

interface ExamResultTableProps {
  exam: ExamDetail
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
          {!isGrade && <TableHead className="text-right">석차</TableHead>}
          <TableHead>선생님 피드백</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {exam.participants.map((participant) => (
          <TableRow key={participant.participantId}>
            <TableCell className="font-medium">{participant.studentName}</TableCell>

            {exam.subjects.map((subject) => {
              const cell = participant.scores.find((score) => score.subjectId === subject.id)
              const rank = participant.subjectRanks.find(
                (item) => item.subjectId === subject.id,
              )?.rank

              return (
                <TableCell key={subject.id} className="text-right tabular-nums">
                  {isGrade ? (
                    ((cell?.gradeId && gradeLabelById.get(cell.gradeId)) ?? '-')
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
              <TableCell className="text-right font-medium tabular-nums">
                {formatScore(participant.total)}
              </TableCell>
            )}
            {!isGrade && (
              <TableCell className="text-right tabular-nums">
                {participant.totalRank ?? '-'}
              </TableCell>
            )}

            <TableCell>
              {participant.teacherComment ? (
                <Popover>
                  <PopoverTrigger className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">
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
        ))}
      </TableBody>

      {!isGrade && exam.classAverage && (
        <TableFooter>
          <TableRow>
            <TableCell className="font-medium">반평균</TableCell>
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
