import { z } from 'zod';

export const accountInfoSchema = z
  .object({
    name: z.string().min(1, '이름을 입력해주세요.'),
    email: z.string().min(1, '이메일을 입력해주세요.').email('올바른 이메일 형식이 아닙니다.'),
    password: z.string().min(8, '비밀번호는 8자 이상 입력해주세요.'),
    passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
    privacyConsent: z.boolean().refine((value) => value === true, {
      message: '개인정보 수집·이용 동의가 필요합니다.',
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

export type AccountInfoFormValues = z.infer<typeof accountInfoSchema>;

export const ACCOUNT_INFO_FIELD_ORDER: (keyof AccountInfoFormValues)[] = [
  'name',
  'email',
  'password',
  'passwordConfirm',
  'privacyConsent',
];
