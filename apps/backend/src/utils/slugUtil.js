const SLUG_REGEX = /^[a-z0-9-]+$/

// 프런트(lib/slugValidation.ts)의 RESERVED_SLUGS와 같아야 한다.
const RESERVED_SLUGS = [
  'login',
  'signup',
  'admin',
  'share',
  'api',
  'files',
  'assets',
  'static',
  'error',
]

// 문제가 없으면 null, 있으면 사유 문자열을 돌려준다.
function getSlugError(slug) {
  if (typeof slug !== 'string' || !slug) return '슬러그를 입력해 주세요.'
  if (!SLUG_REGEX.test(slug)) return '영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.'
  if (RESERVED_SLUGS.includes(slug)) return '사용할 수 없는 슬러그입니다. (예약어)'
  return null
}

module.exports = { getSlugError }
