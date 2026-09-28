const db = require('../db/models');

const PREVIEW_LENGTH = 30;

function throwError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function toPreview(message) {
  return message.length > PREVIEW_LENGTH ? `${message.slice(0, PREVIEW_LENGTH)}...` : message;
}

// SMS 발송 이력 조회 (발송일시 내림차순)
async function list({ academyId, limit, offset }) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } });
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.');
  }

  const { rows, count } = await db.SmsSendLog.findAndCountAll({
    where: { academyId },
    order: [
      ['sentAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit,
    offset,
  });

  const messageLogs = rows.map((log) => ({
    id: log.id,
    sentAt: log.sentAt,
    studentName: log.studentNameSnapshot,
    recipientPhone: log.recipientPhone,
    messagePreview: toPreview(log.message),
    status: log.status,
  }));

  return { messageLogs, count };
}

module.exports = { list };
