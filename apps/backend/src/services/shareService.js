const db = require('../db/models')

function throwError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  throw error
}

// 공유 링크로 리포트 열람 (학부모용, 인증 없음)
async function getByToken(token) {
  const shareLink = await db.ReportShareLink.findOne({ where: { token } })
  if (!shareLink) {
    throwError(404, '유효하지 않은 링크입니다.')
  }

  if (shareLink.expiresAt <= new Date()) {
    throwError(410, '만료된 링크입니다.')
  }

  const report = await db.Report.findOne({
    where: { id: shareLink.reportId },
    include: [
      { model: db.Student, attributes: ['id', 'name'] },
      { model: db.Academy, attributes: ['name', 'logoUrl', 'subscriptionStatus', 'deletedAt'] },
    ],
  })
  if (!report || report.Academy.deletedAt) {
    throwError(404, '유효하지 않은 링크입니다.')
  }

  const subscribed = report.Academy.subscriptionStatus === 'SUBSCRIBED'

  return {
    academyName: report.Academy.name,
    academyLogoUrl: report.Academy.logoUrl,
    studentName: report.Student.name,
    subjectNames: report.subjectNames,
    subjectStats: report.subjectStats,
    teacherFeedback: report.teacherFeedback,
    aiFeedback: subscribed ? report.aiFeedback : null,
    expiresAt: shareLink.expiresAt,
  }
}

module.exports = { getByToken }
