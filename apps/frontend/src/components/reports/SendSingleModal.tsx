import { useState } from 'react'
import { toast } from 'sonner'
import { FormDialog } from '@/components/common/FormDialog'
import { SmsMessageEditor } from '@/components/reports/SmsMessageEditor'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { reportSendApi } from '@/api/reportSendApi'
import { useTemplates } from '@/hooks/useTemplates'
import { getErrorMessage } from '@/lib/errors'
import { getDefaultDraft, isValidSmsMessage, isValidSmsPhone } from '@/lib/smsTemplate'
import type { SmsDraft } from '@/types/reportSend'

interface SendSingleModalProps {
  reportId: string
  studentName: string
  defaultPhone: string
  examName?: string
  link: string
  /** 링크 만료 시각 (ISO 8601) */
  expiresAt: string
  onClose: () => void
  onSent: () => void
}

// 리포트_SMS발송모달_단일 (SCR-SEND-SINGLE)
// 열 때마다 새로 마운트해서 쓴다. 편집 내용은 이 컴포넌트 상태에만 있다.
export function SendSingleModal({
  reportId,
  studentName,
  defaultPhone,
  examName,
  link,
  expiresAt,
  onClose,
  onSent,
}: SendSingleModalProps) {
  const { data: templates, error: templatesError, loading } = useTemplates()

  const [phoneInput, setPhoneInput] = useState<string | null>(null)
  const [draftInput, setDraftInput] = useState<SmsDraft | null>(null)
  const [sending, setSending] = useState(false)

  const phone = phoneInput ?? defaultPhone
  const draft = draftInput ?? getDefaultDraft(templates ?? [], studentName)
  const phoneInvalid = phone.trim() !== '' && !isValidSmsPhone(phone)
  const canSend = !loading && isValidSmsPhone(phone) && isValidSmsMessage(draft.message, link)

  const handleSend = async () => {
    setSending(true)
    try {
      const { results } = await reportSendApi.send([
        { reportId, recipientPhone: phone.trim(), message: draft.message.trim() },
      ])
      const result = results[0]
      if (result?.status === '성공') {
        toast.success('문자를 발송했습니다.')
        onSent()
        onClose()
      } else {
        toast.error(result?.reason ?? '문자를 발송하지 못했습니다.')
      }
    } catch (e) {
      toast.error(getErrorMessage(e, '문자를 발송하지 못했습니다.'))
    } finally {
      setSending(false)
    }
  }

  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && !sending && onClose()}
      title={`${studentName} 학생 리포트 발송`}
      description={examName ? `시험명: ${examName}` : undefined}
      primary={{ label: '발송하기', onClick: handleSend, loading: sending, disabled: !canSend }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="send-single-phone" className="text-sm font-medium">
            수신번호
          </label>
          <Input
            id="send-single-phone"
            value={phone}
            onChange={(event) => setPhoneInput(event.target.value)}
            placeholder="01012345678"
            inputMode="tel"
            aria-invalid={phoneInvalid}
            className="max-w-xs"
          />
          {phoneInvalid && (
            <p className="text-xs text-destructive">올바른 휴대폰 번호를 입력해 주세요.</p>
          )}
        </div>

        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <>
            {templatesError && (
              <p className="text-xs text-destructive">
                템플릿을 불러오지 못했습니다. 메시지를 직접 작성해 주세요.
              </p>
            )}
            <SmsMessageEditor
              studentName={studentName}
              templates={templates ?? []}
              draft={draft}
              onChange={setDraftInput}
              link={link}
              expiresAt={expiresAt}
              disabled={sending}
            />
          </>
        )}
      </div>
    </FormDialog>
  )
}
