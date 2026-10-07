import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { FormDialog } from '@/components/common/FormDialog'
import { FormField } from '@/components/common/FormField'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { templateApi } from '@/api/templateApi'
import { useConfirm } from '@/hooks/useConfirm'
import { getErrorMessage } from '@/lib/errors'
import {
  TEMPLATE_CONTENT_MAX,
  templateFormSchema,
  type SmsTemplate,
  type TemplateFormValues,
} from '@/types/template'
import { cn } from '@/lib/utils'

const FORM_ID = 'template-form'

interface TemplateFormModalProps {
  /** 없으면 추가, 있으면 수정 */
  template?: SmsTemplate
  onClose: () => void
  onSaved: () => void
}

// SMS템플릿추가모달 / SMS템플릿수정모달 (SCR-TEMPLATE-CREATE / SCR-TEMPLATE-UPDATE)
// 열 때마다 새로 마운트해서 쓴다.
export function TemplateFormModal({ template, onClose, onSaved }: TemplateFormModalProps) {
  const confirm = useConfirm()
  const isUpdate = Boolean(template)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { control, handleSubmit } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: template?.name ?? '',
      content: template?.content ?? '',
      isDefault: template?.isDefault ?? false,
    },
  })
  const content = useWatch({ control, name: 'content' })

  const busy = saving || deleting

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true)
    try {
      if (template) {
        await templateApi.update(template.id, values)
        toast.success('템플릿이 수정되었습니다.')
      } else {
        await templateApi.create(values)
        toast.success('템플릿이 추가되었습니다.')
      }
      onSaved()
      onClose()
    } catch (e) {
      toast.error(getErrorMessage(e, '템플릿을 저장하지 못했습니다.'))
      setSaving(false)
    }
  })

  const handleDelete = async () => {
    if (!template) return
    const ok = await confirm({
      title: '템플릿을 삭제할까요?',
      description: template.isDefault
        ? '기본 템플릿을 삭제하면 기본 템플릿이 없는 상태가 됩니다. 삭제한 템플릿은 되돌릴 수 없습니다.'
        : '삭제한 템플릿은 되돌릴 수 없습니다.',
      confirmLabel: '삭제',
      tone: 'destructive',
    })
    if (!ok) return

    setDeleting(true)
    try {
      await templateApi.remove(template.id)
      toast.success('템플릿이 삭제되었습니다.')
      onSaved()
      onClose()
    } catch (e) {
      toast.error(getErrorMessage(e, '템플릿을 삭제하지 못했습니다.'))
      setDeleting(false)
    }
  }

  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && !busy && onClose()}
      title={isUpdate ? '템플릿 수정' : '새 템플릿'}
      primary={{
        label: isUpdate ? '저장' : '추가',
        form: FORM_ID,
        loading: saving,
        disabled: deleting,
      }}
      danger={
        isUpdate
          ? { label: '삭제', onClick: handleDelete, loading: deleting, disabled: saving }
          : undefined
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <FormField control={control} name="name" label="템플릿명" required>
          {(field) => <Input {...field} placeholder="예: 9월 성적표 안내" disabled={busy} />}
        </FormField>

        <FormField
          control={control}
          name="content"
          label="본문"
          required
          description="{학생명}은 발송할 때 학생 이름으로 바뀝니다. 리포트 링크는 본문 아래에 자동으로 붙습니다."
        >
          {(field) => (
            <>
              <Textarea
                {...field}
                rows={8}
                placeholder="안녕하세요, {학생명} 학생 성적표가 도착했습니다. 확인 부탁드립니다."
                disabled={busy}
              />
              <p className="text-right text-xs text-muted-foreground tabular-nums">
                {content.length}/{TEMPLATE_CONTENT_MAX}자
              </p>
            </>
          )}
        </FormField>

        <FormField control={control} name="isDefault" label="기본 템플릿">
          {(field) => (
            <label
              htmlFor={field.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border-[1.5px] p-3.5 transition-colors',
                field.value
                  ? 'border-primary bg-brand-soft'
                  : 'hover:border-primary/50 hover:bg-muted/50',
              )}
            >
              <Checkbox
                id={field.id}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                disabled={busy}
                aria-invalid={field['aria-invalid']}
                className="mt-0.5"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">이 템플릿을 기본으로 사용</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  기본 템플릿은 하나만 지정할 수 있어요. 다른 템플릿이 기본이면 그 설정은
                  해제됩니다.
                </span>
              </span>
            </label>
          )}
        </FormField>
      </form>
    </FormDialog>
  )
}
