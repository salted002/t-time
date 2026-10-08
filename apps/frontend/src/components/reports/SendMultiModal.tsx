import { Fragment, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { FormDialog } from '@/components/common/FormDialog'
import { SmsMessageEditor } from '@/components/reports/SmsMessageEditor'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { reportSendApi } from '@/api/reportSendApi'
import { useConfirm } from '@/hooks/useConfirm'
import { useTemplates } from '@/hooks/useTemplates'
import { getErrorMessage } from '@/lib/errors'
import { getDefaultDraft, isValidSmsMessage, isValidSmsPhone } from '@/lib/smsTemplate'
import type { SmsDraft } from '@/types/reportSend'
import type { SavedReport } from '@/types/report'
import { formatFullDate } from '@/lib/format'
import { PhoneInput } from '../common/PhoneInput'
import { onlyDigits } from '@/lib/phone'

interface RowEdit {
  phone?: string
  draft?: SmsDraft
}

interface SendMultiModalProps {
  reports: SavedReport[]
  onClose: () => void
}

// 리포트_SMS발송모달_복수 (SCR-SEND-MULTI)
// 열 때마다 새로 마운트해서 쓴다. 편집 내용은 이 컴포넌트 상태에만 있다.
export function SendMultiModal({ reports, onClose }: SendMultiModalProps) {
  const confirm = useConfirm()
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { data: templates, error: templatesError, loading } = useTemplates()

  const [edits, setEdits] = useState<Record<string, RowEdit>>({})
  const [uncheckedIds, setUncheckedIds] = useState<string[]>([])
  const [sentIds, setSentIds] = useState<string[]>([])
  const [failReasons, setFailReasons] = useState<Record<string, string>>({})
  const [openId, setOpenId] = useState<string | null>(null)
  const [buffer, setBuffer] = useState<SmsDraft | null>(null)
  const [sending, setSending] = useState(false)

  const rows = reports.map((report) => ({
    report,
    phone: edits[report.id]?.phone ?? report.parentPhone,
    draft: edits[report.id]?.draft ?? getDefaultDraft(templates ?? [], report.studentName),
    link: report.shareLink.url,
    expiresAt: report.shareLink.expiresAt,
  }))

  const pending = rows.filter((row) => !sentIds.includes(row.report.id))
  const checked = pending.filter((row) => !uncheckedIds.includes(row.report.id))
  const isRowValid = (row: (typeof rows)[number]) =>
    isValidSmsPhone(row.phone) && isValidSmsMessage(row.draft.message, row.link)
  const invalidCount = checked.filter((row) => !isRowValid(row)).length
  const allChecked = pending.length > 0 && checked.length === pending.length

  const updateEdit = (reportId: string, patch: RowEdit) =>
    setEdits((current) => ({ ...current, [reportId]: { ...current[reportId], ...patch } }))

  const toggleRow = (reportId: string) =>
    setUncheckedIds((current) =>
      current.includes(reportId) ? current.filter((id) => id !== reportId) : [...current, reportId],
    )

  const toggleAll = () => setUncheckedIds(allChecked ? pending.map((row) => row.report.id) : [])

  const openEditor = (reportId: string, draft: SmsDraft) => {
    setOpenId(reportId)
    setBuffer(draft)
  }

  const saveEditor = () => {
    if (openId && buffer) updateEdit(openId, { draft: buffer })
    setOpenId(null)
    setBuffer(null)
  }

  const requestClose = async () => {
    if (sending) return
    if (pending.length > 0) {
      const ok = await confirm({
        title: '발송을 취소할까요?',
        description:
          '저장한 메시지가 모두 삭제됩니다. 만든 리포트는 리포트 목록에서 다시 확인 후 링크를 발송할 수 있습니다.',
        confirmLabel: '나가기',
        tone: 'destructive',
      })
      if (!ok) return
    }
    onClose()
  }

  const goToTemplates = async () => {
    if (sending) return
    const ok = await confirm({
      title: '템플릿 관리로 이동할까요?',
      description:
        '작성하던 메시지는 지워집니다. 만든 리포트는 리포트 목록에서 다시 확인 후 링크를 발송할 수 있습니다.',
      confirmLabel: '이동',
      tone: 'destructive',
    })
    if (ok) navigate(`/${slug}/templates`)
  }

  const handleSend = async () => {
    setSending(true)
    try {
      const { results, message } = await reportSendApi.send(
        checked.map((row) => ({
          reportId: row.report.id,
          recipientPhone: onlyDigits(row.phone),
          message: row.draft.message.trim(),
        })),
      )

      const succeeded = results.filter((result) => result.status === '성공').map((r) => r.reportId)
      const failed = Object.fromEntries(
        results
          .filter((result) => result.status === '실패')
          .map((result) => [result.reportId, result.reason ?? '발송에 실패했습니다.']),
      )
      setSentIds((current) => [...current, ...succeeded])
      setFailReasons(failed)

      if (Object.keys(failed).length === 0) {
        toast.success(message)
        if (sentIds.length + succeeded.length === reports.length) onClose()
      } else {
        toast.error(`${message}. 실패한 항목은 사유를 확인하고 다시 발송해 주세요.`)
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
      onOpenChange={(open) => !open && requestClose()}
      title="리포트 링크 발송"
      description={
        reports[0]
          ? `링크 만료: ${formatFullDate(reports[0].shareLink.expiresAt)} · 메시지 오른쪽 연필 버튼으로 학생별 메시지를 수정할 수 있습니다.`
          : '메시지 오른쪽 연필 버튼으로 학생별 메시지를 수정할 수 있습니다.'
      }
      size="lg"
      cancel={pending.length === 0 ? '닫기' : '취소'}
      primary={{
        label: `발송하기 (${checked.length}명)`,
        onClick: handleSend,
        loading: sending,
        disabled: loading || checked.length === 0 || invalidCount > 0,
      }}
    >
      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="flex flex-col gap-3">
          {templatesError && (
            <p className="text-xs text-destructive">
              템플릿을 불러오지 못했습니다. 메시지를 직접 작성해 주세요.
            </p>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allChecked}
                    disabled={pending.length === 0 || sending}
                    onCheckedChange={toggleAll}
                    aria-label="전체 선택"
                  />
                </TableHead>
                <TableHead className="w-24">학생명</TableHead>
                <TableHead className="w-40">수신번호</TableHead>
                <TableHead>메시지 미리보기</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const id = row.report.id
                const sent = sentIds.includes(id)
                const phoneInvalid = row.phone.trim() !== '' && !isValidSmsPhone(row.phone)
                const open = openId === id

                return (
                  <Fragment key={id}>
                    <TableRow className={sent ? 'text-muted-foreground' : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={!sent && !uncheckedIds.includes(id)}
                          disabled={sent || sending}
                          onCheckedChange={() => toggleRow(id)}
                          aria-label={`${row.report.studentName} 선택`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.report.studentName}
                        {sent && <p className="text-xs font-normal">발송 완료</p>}
                      </TableCell>
                      <TableCell>
                        <PhoneInput
                          value={row.phone}
                          onChange={(event) => updateEdit(id, { phone: event.target.value })}
                          disabled={sent || sending}
                          inputMode="tel"
                          aria-label={`${row.report.studentName} 수신번호`}
                          aria-invalid={phoneInvalid}
                          className="h-8 w-36"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              row.draft.message.trim()
                                ? 'line-clamp-1 min-w-0 flex-1 text-sm'
                                : 'min-w-0 flex-1 text-sm text-destructive'
                            }
                          >
                            {row.draft.message.trim() || '메시지를 작성해 주세요.'}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={sent || sending}
                            onClick={() => (open ? setOpenId(null) : openEditor(id, row.draft))}
                            aria-label={`${row.report.studentName} 메시지 수정`}
                          >
                            <Pencil />
                          </Button>
                        </div>
                        {failReasons[id] && !sent && (
                          <p className="mt-1 text-xs text-destructive">{failReasons[id]}</p>
                        )}
                      </TableCell>
                    </TableRow>

                    {open && buffer && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={4} className="bg-muted/30 p-4 whitespace-normal">
                          <div className="flex flex-col gap-3">
                            <SmsMessageEditor
                              studentName={row.report.studentName}
                              templates={templates ?? []}
                              draft={buffer}
                              onChange={setBuffer}
                              link={row.link}
                              expiresAt={row.expiresAt}
                              onManageTemplates={goToTemplates}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setOpenId(null)}
                              >
                                닫기
                              </Button>
                              <Button type="button" size="sm" onClick={saveEditor}>
                                저장
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>

          {invalidCount > 0 && (
            <p className="text-xs text-destructive">
              수신번호 또는 메시지를 확인해 주세요. ({invalidCount}건)
            </p>
          )}
        </div>
      )}
    </FormDialog>
  )
}
