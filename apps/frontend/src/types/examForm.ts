import { z } from 'zod'
import type { EvalType } from '@/types/exam'

export const EXAM_MAX_SUBJECTS = 7
export const EXAM_MAX_GRADES = 7

export type ExamFormMode = 'create' | 'edit'

// 만점값은 DECIMAL(5,1): 양수, 소수 첫째 자리까지
const MAX_SCORE_PATTERN = /^\d{1,4}(\.\d)?$/

// 폼 값은 입력창 특성상 숫자도 문자열로 들고 있다가 전송 직전에 변환한다.
const baseSchema = z.object({
  examDate: z.string().nullable(),
  classId: z.string(),
  name: z.string().trim().min(1, '시험이름을 입력해 주세요.'),
  evalType: z.enum(['score', 'score_max', 'grade']),
  subjects: z
    .array(
      z.object({
        subjectId: z.string().optional(), // 수정 모드에서만 존재 (만점값 수정 시 사용)
        name: z.string().trim().min(1, '과목명을 입력해 주세요.'),
        maxScore: z.string(),
      }),
    )
    .min(1)
    .max(EXAM_MAX_SUBJECTS),
  grades: z.array(z.object({ label: z.string() })).max(EXAM_MAX_GRADES),
  memo: z.string(),
})

export function createExamFormSchema(mode: ExamFormMode) {
  return baseSchema.superRefine((values, ctx) => {
    if (!values.examDate) {
      ctx.addIssue({ code: 'custom', path: ['examDate'], message: '시험일자를 선택해 주세요.' })
    }

    // 수정 모드에서 반이 삭제된 시험은 classId가 비어 있다.
    if (mode === 'create' && !values.classId) {
      ctx.addIssue({ code: 'custom', path: ['classId'], message: '응시반을 선택해 주세요.' })
    }

    if (values.evalType === 'score_max') {
      values.subjects.forEach((subject, index) => {
        const valid =
          MAX_SCORE_PATTERN.test(subject.maxScore.trim()) && Number(subject.maxScore) > 0
        if (!valid) {
          ctx.addIssue({
            code: 'custom',
            path: ['subjects', index, 'maxScore'],
            message: '0보다 큰 숫자(소수 첫째 자리까지)',
          })
        }
      })
    }

    if (values.evalType === 'grade') {
      if (values.grades.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['grades'],
          message: '등급을 1개 이상 입력해 주세요.',
        })
      }
      values.grades.forEach((grade, index) => {
        if (!grade.label.trim()) {
          ctx.addIssue({
            code: 'custom',
            path: ['grades', index, 'label'],
            message: '등급 라벨을 입력해 주세요.',
          })
        }
      })
    }
  })
}

export type ExamFormValues = z.infer<typeof baseSchema>

// POST /exams (API 20)
export interface ExamCreatePayload {
  examDate: string
  classId: string
  name: string
  evalType: EvalType
  subjects: { name: string; maxScore?: number }[]
  grades: string[]
  memo: string | null
}

// PATCH /exams/:examId (API 22) — 시험일자, 시험명, 메모, (점수(만점)형) 만점값만 수정 가능
export interface ExamUpdatePayload {
  examDate: string
  name: string
  memo: string | null
  subjects?: { subjectId: string; maxScore: number }[]
}

export interface ExamCreated {
  id: string
}

export function toCreatePayload(values: ExamFormValues): ExamCreatePayload {
  const isScoreMax = values.evalType === 'score_max'

  return {
    examDate: values.examDate ?? '',
    classId: values.classId,
    name: values.name.trim(),
    evalType: values.evalType,
    subjects: values.subjects.map((subject) => ({
      name: subject.name.trim(),
      ...(isScoreMax && { maxScore: Number(subject.maxScore) }),
    })),
    grades: values.evalType === 'grade' ? values.grades.map((grade) => grade.label.trim()) : [],
    memo: values.memo.trim() || null,
  }
}

export function toUpdatePayload(values: ExamFormValues): ExamUpdatePayload {
  return {
    examDate: values.examDate ?? '',
    name: values.name.trim(),
    memo: values.memo.trim() || null,
    ...(values.evalType === 'score_max' && {
      subjects: values.subjects.map((subject) => ({
        subjectId: subject.subjectId ?? '',
        maxScore: Number(subject.maxScore),
      })),
    }),
  }
}
