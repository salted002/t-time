import { z } from 'zod'

export const COUNSELING_TARGETS = ['학생', '학부모'] as const
export type CounselingTarget = (typeof COUNSELING_TARGETS)[number]

// GET /students/:studentId/counselings (API 14)
export interface Counseling {
  id: string
  counselingDate: string // 'YYYY-MM-DD'
  target: CounselingTarget
  counselorName: string
  content: string
  note: string | null
  createdAt: string
}

export interface CounselingListResponse {
  counselings: Counseling[]
  count: number
  page: number
  size: number
}

export const counselingFormSchema = z.object({
  counselingDate: z
    .string()
    .nullable()
    .refine((v) => !!v, '상담일을 선택해 주세요.'),
  target: z.enum(COUNSELING_TARGETS),
  counselorName: z.string().trim().min(1, '상담자명을 입력해 주세요.'),
  content: z.string().trim().min(1, '상담 내용을 입력해 주세요.'),
  note: z.string(),
})

export type CounselingFormValues = z.infer<typeof counselingFormSchema>

// POST / PATCH 공통 (API 15, 17)
export interface CounselingPayload {
  counselingDate: string
  target: CounselingTarget
  counselorName: string
  content: string
  note: string | null
}

export function toCounselingPayload(values: CounselingFormValues): CounselingPayload {
  return {
    counselingDate: values.counselingDate ?? '',
    target: values.target,
    counselorName: values.counselorName.trim(),
    content: values.content.trim(),
    note: values.note.trim() || null,
  }
}
