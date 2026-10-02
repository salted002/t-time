import { useState } from 'react';
import { toast } from 'sonner';
import { FormDialog } from '@/components/common/FormDialog';
import { InfoGrid } from '@/components/common/InfoGrid';
import { ChipList } from '@/components/common/ChipList';
import { Skeleton } from '@/components/ui/skeleton';
import { ClassFormModal } from '@/components/classes/ClassFormModal';
import { classApi } from '@/api/classApi';
import { useConfirm } from '@/hooks/useConfirm';
import { useFetch } from '@/hooks/useFetch';
import { getErrorMessage } from '@/lib/errors';

interface ClassDetailModalProps {
  /** null이면 닫힘 */
  classId: string | null;
  onClose: () => void;
  /** 수정·삭제 후 목록 새로고침용 */
  onChanged: () => void;
}

// 반상세모달 (SCR-CLASS-DETAIL). [수정]을 누르면 반수정모달로 바뀐다.
export function ClassDetailModal({ classId, onClose, onChanged }: ClassDetailModalProps) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { data, loading, error, refetch } = useFetch(
    classId === null ? null : `class:${classId}`,
    (signal) => classApi.get(classId ?? '', signal),
  );

  const close = () => {
    setEditing(false);
    onClose();
  };

  onDeleted: () => void;
}

// 반상세모달 (SCR-CLASS-DETAIL)
export function ClassDetailModal({ classId, onClose, onDeleted }: ClassDetailModalProps) {
  const confirm = useConfirm();
  const [deleting, setDeleting] = useState(false);
  const { data, loading, error } = useFetch(classId === null ? null : `class:${classId}`, (signal) =>
    classApi.get(classId ?? '', signal),
  );

  const handleDelete = async () => {
    if (!data) return;

    const ok = await confirm({
      title: `${data.name}을(를) 삭제할까요?`,
      description: "소속 학생은 삭제되지 않고 '반 없음' 상태가 되며, 되돌릴 수 없습니다.",
      confirmLabel: '삭제',
      tone: 'destructive',
    });
    if (!ok) return;

    setDeleting(true);
    try {
      await classApi.remove(data.id);
      toast.success('반이 삭제되었습니다.');

      onClose();
      onDeleted();
    } catch (e) {
      toast.error(getErrorMessage(e, '반을 삭제하지 못했습니다.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <FormDialog
      open={classId !== null}
      onOpenChange={(open) => !open && onClose()}
      title={data?.name ?? '반 상세'}
      cancel={false}
      danger={{ label: '삭제', onClick: handleDelete, loading: deleting, disabled: !data }}
      // TODO: 반 수정 화면 연결
      primary={{ label: '수정', disabled: !data }}
    >
      {loading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {data && (
        <InfoGrid
          columns={2}
          items={[
            { label: '반이름', value: data.name },
            { label: '담임강사', value: data.teacherName ?? '(미지정)' },
            { label: '학생수', value: `${data.studentCount}명`, span: 2 },
            {
              label: '학생목록',
              span: 2,
              value:
                data.students.length > 0 ? (
                  <ChipList items={data.students.map((student) => ({ id: student.id, label: student.name }))} />
                ) : (
                  '-'
                ),
            },
          ]}
        />
      )}
    </FormDialog>
  );
}
