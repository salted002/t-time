import { z } from 'zod'
import type { ExamDetail } from '@/types/exam'

// 점수는 DECIMAL(5,1): 0 이상, 소수 첫째 자리까지
const SCORE_PATTERN = /^\d{1,4}(\.\d)?$/

// 폼 값은 입력창 특성상 문자열로 들고 있다가 전송 직전에 변환한다.
// scores는 exam.subjects 순서와 같은 배열 (점수형: 점수 문자열, 등급형: gradeId. 빈 문자열 = 미입력)
const rowSchema = z.object({
  participantId: z.string().optional(), // 기존 응시자
  studentId: z.string().optional(), // 새로 추가하는 학생
  studentName: z.string(),
  included: z.boolean(), // false = 응시자에서 제외된 상태 (다시 추가 가능)
  scores: z.array(z.string()),
  teacherComment: z.string(),
})

const resultSchema = z.object({ participants: z.array(rowSchema) })

export type ExamResultFormValues = z.infer<typeof resultSchema>
export type ExamResultRowValues = ExamResultFormValues['participants'][number]

export function createExamResultSchema(exam: ExamDetail) {
  return resultSchema.superRefine((values, ctx) => {
    if (exam.evalType === 'grade') return

    values.participants.forEach((row, rowIndex) => {
      if (!row.included) return

      exam.subjects.forEach((subject, subjectIndex) => {
        const text = (row.scores[subjectIndex] ?? '').trim()
        if (text === '') return

        const path = ['participants', rowIndex, 'scores', subjectIndex]

        if (!SCORE_PATTERN.test(text)) {
          ctx.addIssue({
            code: 'custom',
            path,
            message: '0 이상의 숫자(소수 첫째 자리까지)로 입력해 주세요.',
          })
          return
        }

        if (subject.maxScore !== null && Number(text) > subject.maxScore) {
          ctx.addIssue({
            code: 'custom',
            path,
            message: `만점(${subject.maxScore})을 초과할 수 없습니다.`,
          })
        }
      })
    })
  })
}

// 응시 중인 학생 + 제외 후보(excludedStudents)를 한 배열로 만든다. 제외 후보는 included=false.
export function toResultFormValues(exam: ExamDetail): ExamResultFormValues {
  const byName = (a: { studentName: string }, b: { studentName: string }) =>
    a.studentName.localeCompare(b.studentName, 'ko')

  const participants: ExamResultRowValues[] = exam.participants
    .map((participant) => ({
      participantId: participant.participantId,
      studentName: participant.studentName,
      included: true,
      scores: exam.subjects.map((subject) => {
        const cell = participant.scores.find((score) => score.subjectId === subject.id)
        if (exam.evalType === 'grade') return cell?.gradeId ?? ''
        return cell?.score === null || cell?.score === undefined ? '' : String(cell.score)
      }),
      teacherComment: participant.teacherComment ?? '',
    }))
    .sort(byName)

  const excluded: ExamResultRowValues[] = exam.excludedStudents
    .map((student) => ({
      studentId: student.studentId,
      studentName: student.name,
      included: false,
      scores: exam.subjects.map(() => ''),
      teacherComment: '',
    }))
    .sort(byName)

  return { participants: [...participants, ...excluded] }
}

// PUT /exams/:examId/results (API 23) — 요청 배열 = 저장 후의 응시자 전체 목록
export interface ExamResultsPayload {
  participants: (
    | {
        participantId: string
        scores: Record<string, number | string | null>
        teacherComment: string | null
      }
    | {
        studentId: string
        scores: Record<string, number | string | null>
        teacherComment: string | null
      }
  )[]
}

export function toResultsPayload(
  values: ExamResultFormValues,
  exam: ExamDetail,
): ExamResultsPayload {
  const isGrade = exam.evalType === 'grade'

  return {
    participants: values.participants
      .filter((row) => row.included)
      .map((row) => {
        const scores = Object.fromEntries(
          exam.subjects.map((subject, index) => {
            const text = (row.scores[index] ?? '').trim()
            if (text === '') return [subject.id, null]
            return [subject.id, isGrade ? text : Number(text)]
          }),
        )
        const teacherComment = row.teacherComment.trim() || null

        return row.participantId
          ? { participantId: row.participantId, scores, teacherComment }
          : { studentId: row.studentId ?? '', scores, teacherComment }
      }),
  }
}
