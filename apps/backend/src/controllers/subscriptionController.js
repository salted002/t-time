const subscriptionService = require('../services/subscriptionService')

async function get(req, res) {
  const { academyId } = req.academy
  const { subscription, plans } = await subscriptionService.get({ academyId })
  return res
    .status(200)
    .json({ success: true, subscription, plans, message: '구독 정보 조회 성공' })
}

async function subscribe(req, res) {
  const { academyId } = req.academy
  const subscription = await subscriptionService.subscribe({ academyId, planId: req.body.planId })
  return res.status(200).json({ success: true, subscription, message: '구독이 시작되었습니다.' })
}

async function cancel(req, res) {
  const { academyId } = req.academy
  const subscription = await subscriptionService.cancel({ academyId })
  return res.status(200).json({ success: true, subscription, message: '구독이 취소되었습니다.' })
}

module.exports = { get, subscribe, cancel }
