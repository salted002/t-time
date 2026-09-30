const shareService = require('../services/shareService')

async function getByToken(req, res) {
  const { token } = req.params

  const report = await shareService.getByToken(token)

  return res.status(200).json({
    success: true,
    ...report,
    message: '공유 리포트 조회 성공',
  })
}

module.exports = { getByToken }
