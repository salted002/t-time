import { useState } from 'react'
import { MessageSquare, MessageSquareText, Plus } from 'lucide-react'
import { PageHeader } from '@/components/templates/PageHeader'
import { DataTable, type Column } from '@/components/templates/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { TemplateFormModal } from '@/components/messages/TemplateFormModal'
import { Button } from '@/components/ui/button'
import { useTemplates } from '@/hooks/useTemplates'
import type { SmsTemplate } from '@/types/template'
import { PAGE_TEXT } from '@/lib/pageText'

const COLUMNS: Column<SmsTemplate>[] = [
  {
    key: 'name',
    header: '템플릿명',
    className: 'w-64 font-semibold',
    cell: (template) => (
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-foreground"
        >
          <MessageSquare className="size-4" />
        </span>
        {template.name}
      </div>
    ),
  },
  {
    key: 'contentPreview',
    header: '본문 미리보기',
    cell: (template) => (
      <span className="line-clamp-1 text-muted-foreground">{template.contentPreview}</span>
    ),
  },
  {
    key: 'isDefault',
    header: '기본 템플릿',
    className: 'w-32',
    cell: (template) =>
      template.isDefault ? <StatusBadge tone="success">기본</StatusBadge> : null,
  },
]

type ModalState = { template?: SmsTemplate } | null

// SMS템플릿목록 (SCR-TEMPLATE-LIST)
export default function TemplateListPage() {
  const { data, error, loading, refetch } = useTemplates()
  const [modal, setModal] = useState<ModalState>(null)

  return (
    <div>
      <PageHeader
        title="템플릿 관리"
        {...PAGE_TEXT.TEMPLATE_LIST}
        icon={MessageSquareText}
        actions={
          <Button type="button" onClick={() => setModal({})}>
            <Plus />새 템플릿
          </Button>
        }
      />

      <DataTable
        columns={COLUMNS}
        rows={data ?? []}
        rowKey={(template) => template.id}
        onRowClick={(template) => setModal({ template })}
        loading={loading}
        empty={
          error
            ? { title: '템플릿 목록을 불러오지 못했습니다', description: error }
            : {
                title: '등록된 템플릿이 없습니다',
                description: '[새 템플릿]으로 첫 문자 템플릿을 만들어 보세요.',
              }
        }
      />

      {modal && (
        <TemplateFormModal
          key={modal.template?.id ?? 'new'}
          template={modal.template}
          onClose={() => setModal(null)}
          onSaved={refetch}
        />
      )}
    </div>
  )
}
