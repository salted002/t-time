import { useState } from 'react'
import { toast } from 'sonner'
import { FormDialog } from '@/components/common/FormDialog'
import { InfoGrid } from '@/components/common/InfoGrid'
import { counselingApi } from '@/api/counselingApi'
import { useConfirm } from '@/hooks/useConfirm'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/format'
import type { Counseling } from '@/types/counseling'

interface CounselingDetailModalProps {
  studentId: string
  counseling: Counseling
  onClose: () => void
  onEdit: () => void
  onDeleted: () => void
}

// 학생상담상세모달 (SCR-STU-COUNSEL-DETAIL)
export function CounselingDetailModal({
  studentId,
  counseling,
  onClose,
  onEdit,
  onDeleted,
}: CounselingDetailModalProps) {
  const confirm = useConfirm()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    const ok = await confirm({
      title: '상담 기록을 삭제할까요?',
      description: '삭제한 상담 기록은 되돌릴 수 없습니다.',
      confirmLabel: '삭제',
      tone: 'destructive',
    })
    if (!ok) return

    setDeleting(true)
    try {
      await counselingApi.remove(studentId, counseling.id)
      toast.success('상담 기록이 삭제되었습니다.')
      onDeleted()
    } catch (e) {
      toast.error(getErrorMessage(e, '상담 기록을 삭제하지 못했습니다.'))
      setDeleting(false)
    }
  }

  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && !deleting && onClose()}
      title={`${formatDate(counseling.counselingDate)} 상담`}
      cancel={false}
      primary={{ label: '수정하기', onClick: onEdit, disabled: deleting }}
      danger={{ label: '삭제하기', onClick: handleDelete, loading: deleting }}
    >
      <InfoGrid
        columns={2}
        items={[
          { label: '상담일', value: formatDate(counseling.counselingDate) },
          { label: '대상', value: counseling.target },
          { label: '상담자명', value: counseling.counselorName },
          { label: '상담 내용', value: counseling.content, span: 2 },
          { label: '내부공유용 메모', value: counseling.note, span: 2 },
        ]}
      />
    </FormDialog>
  )
}
