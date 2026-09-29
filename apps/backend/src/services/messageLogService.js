const db = require('../db/models');

const PREVIEW_LENGTH = 30;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// ponytail: FRONTEND_URL 미정이라 상대경로로 반환, 확정되면 config/env.js 값으로 앞에 붙임
const SHARE_PATH = '/share';

function throwError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function toPreview(message) {
  return message.length > PREVIEW_LENGTH ? `${message.slice(0, PREVIEW_LENGTH)}...` : message;
}

async function assertAcademy(academyId) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } });
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.');
  }
}

// SMS 발송 이력 조회 (발송일시 내림차순)
async function list({ academyId, limit, offset }) {
  await assertAcademy(academyId);

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

// SMS 발송 이력 상세 조회
async function getById({ academyId, logId }) {
  await assertAcademy(academyId);

  if (!UUID_PATTERN.test(logId)) {
    throwError(404, '발송 이력을 찾을 수 없습니다.');
  }

  const log = await db.SmsSendLog.findOne({
    where: { id: logId, academyId },
    include: [
      {
        model: db.ReportShareLink,
        required: false,
        include: [
          {
            model: db.Report,
            attributes: ['id'],
            required: false,
            include: [{ model: db.Student, attributes: ['name'], required: false }],
          },
        ],
      },
    ],
  });

  if (!log) {
    throwError(404, '발송 이력을 찾을 수 없습니다.');
  }

  const shareLink = log.ReportShareLink;
  const report = shareLink ? shareLink.Report : null;

  return {
    id: log.id,
    sentAt: log.sentAt,
    studentName: log.studentNameSnapshot,
    recipientPhone: log.recipientPhone,
    message: log.message,
    status: log.status,
    sentLink: shareLink ? `${SHARE_PATH}/${shareLink.token}` : null,
    linkExpired: shareLink ? shareLink.expiresAt < new Date() : null,
    linkedReport: report
      ? { reportId: report.id, studentName: report.Student ? report.Student.name : null }
      : null,
    providerMeta: null,
  };
}

module.exports = { list, getById };
