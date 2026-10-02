// POST /reports/send (API 36)
export interface SendItem {
  reportId: string
  recipientPhone: string
  message: string
}

export interface SendResult {
  reportId: string
  status: '성공' | '실패'
  messageLogId?: string
  reason?: string
}

export interface SendResponse {
  results: SendResult[]
  message: string
}

// 발송 모달에서 편집 중인 메시지. 링크는 서버가 본문 뒤에 붙이므로 여기에 포함하지 않는다.
export interface SmsDraft {
  templateId: string | null
  message: string
}
