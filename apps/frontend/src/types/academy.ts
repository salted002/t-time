import { z } from 'zod';

const PHONE_REGEX = /^0\d{1,2}-\d{3,4}-\d{4}$/;
const SLUG_REGEX = /^[a-z0-9-]+$/;
const BUSINESS_NUMBER_REGEX = /^\d{3}-\d{2}-\d{5}$/;
const MAX_LOGO_SIZE = 5 * 1024 * 1024;

export const academyInfoSchema = z.object({
  academyName: z.string().min(1, '학원명을 입력해주세요.'),
  representativePhone: z
    .string()
    .min(1, '대표연락처를 입력해주세요.')
    .regex(PHONE_REGEX, '올바른 전화번호 형식이 아닙니다. (예: 032-123-4567)'),
  academySlug: z
    .string()
    .min(1, '학원 슬러그를 입력해주세요.')
    .regex(SLUG_REGEX, '영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.'),
  logo: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_LOGO_SIZE, '이미지 용량은 5MB를 넘을 수 없습니다.')
    .optional(),
  address: z.string().optional(),
  businessRegistrationNumber: z
    .string()
    .min(1, '사업자등록번호를 입력해주세요.')
    .regex(BUSINESS_NUMBER_REGEX, '올바른 사업자등록번호 형식이 아닙니다. (예: 123-45-67890)'),
  representativeName: z.string().optional(),
  smsSenderNumber: z
    .string()
    .optional()
    .refine((value) => !value || PHONE_REGEX.test(value), '올바른 전화번호 형식이 아닙니다.'),
});

export type AcademyInfoFormValues = z.infer<typeof academyInfoSchema>;

export const ACADEMY_INFO_FIELD_ORDER: (keyof AcademyInfoFormValues)[] = [
  'academyName',
  'representativePhone',
  'academySlug',
  'logo',
  'address',
  'businessRegistrationNumber',
  'representativeName',
  'smsSenderNumber',
];
