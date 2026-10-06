// 매칭되는 라우트가 없는 요청(존재하지 않는 경로)을 404 에러로 만들어 errorHandler로 넘긴다.
// Express 기본 HTML 404 대신 errorHandler가 { success: false, message } JSON으로 응답한다.
function notFound(req, res, next) {
  const error = new Error('존재하지 않는 API 경로입니다.')
  error.statusCode = 404
  next(error)
}

module.exports = notFound
