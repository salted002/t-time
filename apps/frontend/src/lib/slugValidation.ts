import { z } from 'zod';

const SLUG_REGEX = /^[a-z0-9-]+$/;

export const RESERVED_SLUGS = [
  'login',
  'signup',
  'admin',
  'share',
  'api',
  'files',
  'assets',
  'static',
  'error',
] as const;

export const slugSchema = z
  .string()
  .min(1, '학원 슬러그를 입력해주세요.')
  .regex(SLUG_REGEX, '영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.')
  .refine(
    (value) => !(RESERVED_SLUGS as readonly string[]).includes(value),
    '사용할 수 없는 슬러그입니다. (예약어)',
  );
