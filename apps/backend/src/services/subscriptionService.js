const db = require('../db/models')

const PLANS = [
  { id: 'FREE', name: 'FREE' },
  {
    id: 'SUBSCRIBED',
    name: '구독하기',
    description: 'AI 피드백 잠금 해제(시험/통계/리포트)',
  },
]

function throwError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  throw error
}

async function findAcademy(academyId) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) throwError(401, '유효하지 않은 토큰입니다.')
  return academy
}

function toSubscription(academy) {
  return { status: academy.subscriptionStatus, subscribedAt: academy.subscribedAt }
}

async function get({ academyId }) {
  const academy = await findAcademy(academyId)
  return { subscription: toSubscription(academy), plans: PLANS }
}

async function subscribe({ academyId, planId }) {
  if (planId !== 'SUBSCRIBED') throwError(400, 'planId 값이 올바르지 않습니다.')

  const academy = await findAcademy(academyId)
  // 이미 구독 중이면 구독 시각을 덮어쓰지 않는다.
  if (academy.subscriptionStatus !== 'SUBSCRIBED') {
    await academy.update({ subscriptionStatus: 'SUBSCRIBED', subscribedAt: new Date() })
  }
  return toSubscription(academy)
}

async function cancel({ academyId }) {
  const academy = await findAcademy(academyId)
  if (academy.subscriptionStatus !== 'FREE') {
    await academy.update({ subscriptionStatus: 'FREE', subscribedAt: null })
  }
  return toSubscription(academy)
}

module.exports = { get, subscribe, cancel }
