const classService = require('../services/classService');

async function list(req, res) {
  const { academyId } = req.academy;

  const classes = await classService.list({ academyId });

  return res.status(200).json({
    success: true,
    classes,
    message: '반 목록 조회 성공',
  });
}

module.exports = { list };
