const { SolapiMessageService } = require('solapi')
const env = require('../config/env')

const messageService = new SolapiMessageService(env.sms.apiKey, env.sms.apiSecret)

// SMS 단건 발송. 실패하면 실패 사유를 담아 에러를 던진다.
async function sendOne({ to, from, text }) {
  const result = await messageService.send({ to, from, text })

  if (Number(result.errorCount) > 0) {
    const failed = result.resultList.find((r) => r.statusCode !== '2000') // 접수 실패 건 찾기
    const error = new Error(failed ? failed.statusMessage : '발송에 실패했습니다.')
    throw error
  }

  return result
}

module.exports = { sendOne }
