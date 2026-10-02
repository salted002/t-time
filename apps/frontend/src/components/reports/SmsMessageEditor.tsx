import { Lock } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/hooks/useConfirm'
import { SMS_MAX_BYTES, SMS_SHORT_BYTES, getSmsBytes, renderSmsTemplate } from '@/lib/smsTemplate'
import type { SmsDraft } from '@/types/reportSend'
import type { SmsTemplate } from '@/types/template'

interface SmsMessageEditorProps {
  studentName: string
  templates: SmsTemplate[]
  draft: SmsDraft
  onChange: (draft: SmsDraft) => void
  link: string
  disabled?: boolean
  onManageTemplates?: () => void
}

// 템플릿 선택 + 본문 편집 + 잠긴 링크 표시 (단일·다중 발송 공용)
export function SmsMessageEditor({
  studentName,
  templates,
  draft,
  onChange,
  link,
  disabled,
  onManageTemplates,
}: SmsMessageEditorProps) {
  const confirm = useConfirm()

  const items = templates.map((template) => ({ value: template.id, label: template.name }))
  const applied = templates.find((template) => template.id === draft.templateId)
  const appliedText = applied ? renderSmsTemplate(applied.content, studentName) : ''
  const bytes = getSmsBytes(draft.message.trim(), link)

  const handleTemplateChange = async (templateId: string | null) => {
    const template = templates.find((item) => item.id === templateId)
    if (!template || template.id === draft.templateId) return

    const edited = draft.message.trim() !== '' && draft.message !== appliedText
    if (edited) {
      const ok = await confirm({
        title: '템플릿을 적용할까요?',
        description: '작성 중인 내용은 템플릿 본문으로 바뀝니다.',
        confirmLabel: '적용',
      })
      if (!ok) return
    }
    onChange({
      templateId: template.id,
      message: renderSmsTemplate(template.content, studentName),
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-sm font-medium">템플릿</span>
        {templates.length > 0 ? (
          <Select
            items={items}
            value={draft.templateId}
            onValueChange={(value) => handleTemplateChange(value as string | null)}
            disabled={disabled}
          >
            <SelectTrigger className="w-full max-w-xs" aria-label="템플릿 선택">
              <SelectValue placeholder="템플릿 선택" />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm text-muted-foreground">등록된 템플릿이 없습니다.</span>
        )}
        {onManageTemplates && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="ml-auto px-0"
            onClick={onManageTemplates}
          >
            템플릿 관리
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Textarea
          rows={5}
          value={draft.message}
          onChange={(event) => onChange({ ...draft, message: event.target.value })}
          placeholder="학부모에게 보낼 메시지를 입력하세요."
          aria-label="메시지 본문"
          disabled={disabled}
        />
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <Lock className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{link}</span>
          <span className="shrink-0 text-xs text-muted-foreground">(삭제불가)</span>
        </div>
        <p
          className={
            bytes > SMS_MAX_BYTES ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'
          }
        >
          {bytes}/{SMS_MAX_BYTES}바이트
          {bytes > SMS_SHORT_BYTES &&
            bytes <= SMS_MAX_BYTES &&
            ' · 90바이트를 넘으면 장문 문자로 발송됩니다.'}
          {bytes > SMS_MAX_BYTES && ' · 메시지를 줄여 주세요.'}
        </p>
      </div>
    </div>
  )
}
