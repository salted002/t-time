const messageLogService = require('../services/messageLogService');
const { parsePagination } = require('../utils/paginationUtil');

async function list(req, res) {
  const { academyId } = req.academy;
  const { page, size, limit, offset } = parsePagination(req.query);

  const { messageLogs, count } = await messageLogService.list({ academyId, limit, offset });

  return res.status(200).json({
    success: true,
    messageLogs,
    count,
    page,
    size,
    message: '발송 이력 조회 성공',
  });
}

module.exports = { list };
