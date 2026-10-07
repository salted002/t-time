import { z } from 'zod'
import { slugSchema } from '@/lib/slugValidation'
import { academyInfoSchema } from '@/types/academy'

const PHONE_REGEX = /^0\d{1,2}-\d{3,4}-\d{4}$/
const BUSINESS_NUMBER_REGEX = /^\d{3}-\d{2}-\d{5}$/
const MIN_PASSWORD_LENGTH = 8

// 개별 학원 수정 폼 (SCR-ADMIN-ACADEMY-UPDATE) — 학원 정보 + 관리자(사용자) 정보
export const adminAcademyUpdateSchema = z.object({
  academyName: z.string().trim().min(1, '학원명을 입력해주세요.'),
  academySlug: slugSchema,
  representativePhone: z
    .string()
    .min(1, '대표연락처를 입력해주세요.')
    .regex(PHONE_REGEX, '올바른 전화번호 형식이 아닙니다. (예: 032-123-4567)'),
  address: z.string().optional(),
  businessRegistrationNumber: z
    .string()
    .min(1, '사업자번호를 입력해주세요.')
    .regex(BUSINESS_NUMBER_REGEX, '올바른 사업자번호 형식이 아닙니다. (예: 123-45-67890)'),
  representativeName: z.string().trim().min(1, '대표자명을 입력해주세요.'),
  smsSenderNumber: academyInfoSchema.shape.smsSenderNumber,
  logo: academyInfoSchema.shape.logo,
  userName: z.string().trim().min(1, '관리자 이름을 입력해주세요.'),
  userEmail: z
    .string()
    .min(1, '로그인 이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),
  userPassword: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.length >= MIN_PASSWORD_LENGTH,
      `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`,
    ),
})

export type AdminAcademyUpdateFormValues = z.infer<typeof adminAcademyUpdateSchema>
