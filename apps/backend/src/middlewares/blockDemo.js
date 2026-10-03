const db = require('../db/models')

// 데모 계정이 시연을 망가뜨릴 수 있는 기능(학원 삭제, 비밀번호 변경)을 막는다.
// authenticateAcademy 뒤에 붙여서 쓴다.
async function blockDemo(req, res, next) {
  const academy = await db.Academy.findOne({
    where: { id: req.academy.academyId },
    attributes: ['id', 'isDemo'],
  })

  if (academy && academy.isDemo) {
    const error = new Error('데모 계정에서는 사용할 수 없는 기능입니다.')
    error.statusCode = 403
    throw error
  }

  next()
}

module.exports = { blockDemo }
