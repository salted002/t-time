import { z } from 'zod'
import { slugSchema } from '@/lib/slugValidation'
import { PHONE_REGEX, onlyDigits } from '@/lib/phone'

const BUSINESS_NUMBER_REGEX = /^\d{3}-?\d{2}-?\d{5}$/
const MAX_LOGO_SIZE = 5 * 1024 * 1024

export const academyInfoSchema = z.object({
  academyName: z.string().min(1, '학원명을 입력해주세요.'),
  representativePhone: z
    .string()
    .min(1, '대표연락처를 입력해주세요.')
    .refine(
      (value) => PHONE_REGEX.test(onlyDigits(value)),
      '올바른 전화번호 형식이 아닙니다. (예: 032-123-4567)',
    )
    // 입력창에는 하이픈이 보이지만 제출할 때는 숫자만 보낸다
    .transform(onlyDigits),
  academySlug: slugSchema,
  logo: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_LOGO_SIZE, '이미지 용량은 5MB를 넘을 수 없습니다.')
    .optional(),
  address: z.string().optional(),
  businessRegistrationNumber: z
    .string()
    .min(1, '사업자등록번호를 입력해주세요.')
    .regex(BUSINESS_NUMBER_REGEX, '올바른 사업자등록번호 형식이 아닙니다. (예: 123-45-67890)')
    // 하이픈 없이 입력해도 서버 중복 검사가 맞도록 항상 123-45-67890 형태로 보낸다
    .transform((value) => value.replace(/^(\d{3})-?(\d{2})-?(\d{5})$/, '$1-$2-$3')),
  representativeName: z.string().min(1, '대표자명을 입력해주세요.'),
  smsSenderNumber: z
    .string()
    .refine(
      (value) => !value || PHONE_REGEX.test(onlyDigits(value)),
      '올바른 전화번호 형식이 아닙니다.',
    )
    .transform(onlyDigits)
    .optional(),
})

export type AcademyInfoFormValues = z.infer<typeof academyInfoSchema>

export const academySettingsSchema = z.object({
  representativePhone: z
    .string()
    .refine(
      (value) => !value || PHONE_REGEX.test(onlyDigits(value)),
      '올바른 전화번호 형식이 아닙니다. (예: 032-123-4567)',
    )
    .transform(onlyDigits)
    .optional(),
  address: z.string().optional(),
  academySlug: slugSchema,
  logo: academyInfoSchema.shape.logo,
  smsSenderNumber: academyInfoSchema.shape.smsSenderNumber,
})

export type AcademySettingsFormValues = z.infer<typeof academySettingsSchema>

export const ACADEMY_INFO_FIELD_ORDER: (keyof AcademyInfoFormValues)[] = [
  'academyName',
  'representativePhone',
  'academySlug',
  'logo',
  'address',
  'businessRegistrationNumber',
  'representativeName',
  'smsSenderNumber',
]
