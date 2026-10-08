const onlyDigits = (v) => String(v ?? '').replace(/\D/g, '')
// undefined(수정 안 함)는 그대로 두고, 값이 있을 때만 숫자로 바꿈
const normalizePhone = (v) => (v === undefined || v === null ? v : onlyDigits(v))

const MOBILE_PATTERN = /^01[016789]\d{7,8}$/ // 휴대폰 (학부모, 문자 수신번호)
const PHONE_PATTERN = /^0\d{8,10}$/ // 유선+휴대폰 (대표연락처, 발신번호)

module.exports = { onlyDigits, normalizePhone, MOBILE_PATTERN, PHONE_PATTERN }
