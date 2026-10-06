const { Sequelize } = require('sequelize')
const multer = require('multer')

// err.message가 없을 때 쓰는 상태 코드별 기본 메시지 (에러 코드 표의 발생 상황)
const DEFAULT_ERROR_MESSAGES = {
  400: '필수값 누락, 형식 오류, 만점 초과 점수, 슬러그 예약어 등 입력값 유효성 오류가 발생했습니다.',
  401: 'Authorization 헤더가 없거나, 토큰이 만료되었거나, 이메일/비밀번호가 일치하지 않습니다.',
  403: '접근 권한이 없습니다. (유효하지 않은 토큰, 삭제된 학원, 다른 학원의 리소스, 허용되지 않은 계정 유형, 데모 계정 제한 동작)',
  404: '존재하지 않는 리소스입니다.',
  409: '슬러그·사업자번호·이메일이 이미 사용 중입니다.',
  410: '만료된 리포트 공유 링크입니다.',
  422: '리포트 생성 조건을 충족하지 않습니다. (선택 과목 응시 이력 없음)',
  500: '서버 내부 오류가 발생했습니다.',
  502: '외부 서비스(AI, CoolSMS 등) 호출에 실패했습니다.',
}

function errorHandler(err, req, res, next) {
  console.error('======error handler========')
  console.error(err.message)

  // 응답이 이미 시작됐다면 Express 기본 핸들러가 연결을 정리하도록 넘긴다.
  if (res.headersSent) {
    return next(err)
  }

  // 요청 본문 JSON 파싱 실패 (body-parser)
  if (err.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ success: false, message: '요청 본문의 JSON 형식이 올바르지 않습니다.' })
  }

  if (err.statusCode) {
    const message = err.message || DEFAULT_ERROR_MESSAGES[err.statusCode] || 'Internal Server Error'
    return res.status(err.statusCode).json({ success: false, message: message })
  } else if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? '파일 크기는 5MB를 넘을 수 없습니다.'
        : '파일 업로드 요청이 올바르지 않습니다.'
    return res.status(400).json({ success: false, message })
  } else if (err instanceof Sequelize.UniqueConstraintError) {
    return res.status(409).json({
      success: false,
      message: 'Unique constraint violation: duplicate data',
    })
  } else if (err instanceof Sequelize.ValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error: invalid data format',
    })
  } else if (err instanceof Sequelize.ForeignKeyConstraintError) {
    return res.status(400).json({ success: false, message: 'Foreign key constraint error' })
  } else if (
    err instanceof Sequelize.ConnectionError ||
    err instanceof Sequelize.ConnectionRefusedError
  ) {
    return res.status(500).json({ success: false, message: 'Database connection error' })
  } else if (err instanceof Sequelize.TimeoutError) {
    return res.status(504).json({ success: false, message: 'Internal Server Error' })
  } else {
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

module.exports = errorHandler
