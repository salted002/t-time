import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { FormDialog } from '@/components/common/FormDialog';
import { FormField } from '@/components/common/FormField';
import { ChipList } from '@/components/common/ChipList';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { classApi } from '@/api/classApi';
import { useConfirm } from '@/hooks/useConfirm';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/lib/api';
import { STUDENT_STATUS_TONE } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import type { Student } from '@/types/student';

const FORM_ID = 'class-create-form';

const classCreateSchema = z.object({
  name: z.string().trim().min(1, '반 이름을 입력해 주세요.'),
  teacherName: z.string().trim(),
});

type ClassCreateValues = z.infer<typeof classCreateSchema>;

const DEFAULT_VALUES: ClassCreateValues = { name: '', teacherName: '' };

interface ClassCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

// 반추가모달 (SCR-CLASS-CREATE)
export function ClassCreateModal({ open, onOpenChange, onCreated }: ClassCreateModalProps) {
  const confirm = useConfirm();
  const [selected, setSelected] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim());

  const form = useForm<ClassCreateValues>({
    resolver: zodResolver(classCreateSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // 퇴원생은 반에 넣을 일이 없어 재원·휴원만 검색
  const { data: results, loading: searching } = useFetch(
    open && q ? `class-create-search:${q}` : null,
    (signal) =>
      api
        .get<{ students: Student[] }>('/students', { params: { q, size: 10, status: '재원,휴원' }, signal })
        .then((response) => response.data.students),
  );
  const candidates = (results ?? []).filter((student) => !selected.some((item) => item.id === student.id));

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      form.reset(DEFAULT_VALUES);
      setSelected([]);
      setSearch('');
    }
  };

  const addStudent = async (student: Student) => {
    if (student.className) {
      const newClassName = form.getValues('name').trim() || '새 반';
      const ok = await confirm({
        title: `${student.name} 학생의 반을 옮길까요?`,
        description: `학생의 반이 ${student.className}에서 ${newClassName}(으)로 바뀝니다. 계속하시겠습니까?`,
        confirmLabel: '계속',
      });
      if (!ok) return;
    }
    setSelected((prev) => [...prev, student]);
    setSearch('');
  };

  const onSubmit = async (values: ClassCreateValues) => {
    try {
      await classApi.create({
        name: values.name,
        teacherName: values.teacherName || null,
        studentIds: selected.map((student) => student.id),
      });
      toast.success('반이 추가되었습니다.');
      handleOpenChange(false);
      onCreated();
    } catch (e) {
      const message = getErrorMessage(e, '반을 추가하지 못했습니다.');
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        form.setError('name', { message });
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="반 추가"
      primary={{ label: '추가', form: FORM_ID, loading: form.formState.isSubmitting }}
    >
      <div className="flex flex-col gap-5">
        <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <FormField control={form.control} name="name" label="반이름" required>
            {(field) => <Input {...field} placeholder="예: 초급반 A" />}
          </FormField>
          <FormField control={form.control} name="teacherName" label="담임강사">
            {(field) => <Input {...field} placeholder="미지정 가능" />}
          </FormField>
        </form>

        {/* 검색창에서 Enter가 반 생성을 제출하지 않도록 form 밖에 둔다 */}
        <Field>
          <FieldLabel>학생 추가</FieldLabel>
          <SearchInput value={search} onChange={setSearch} placeholder="학생 이름 검색" />

          {search.trim() && q && (
            <ul className="max-h-48 overflow-y-auto rounded-md border">
              {searching && <li className="px-3 py-2 text-sm text-muted-foreground">검색 중…</li>}
              {!searching && candidates.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">검색 결과가 없습니다.</li>
              )}
              {!searching &&
                candidates.map((student) => (
                  <li key={student.id}>
                    <button
                      type="button"
                      onClick={() => addStudent(student)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                    >
                      <span className="font-medium">{student.name}</span>
                      <span className="text-muted-foreground">{student.className ?? '반 없음'}</span>
                      <span className="ml-auto">
                        <StatusBadge tone={STUDENT_STATUS_TONE[student.status]}>{student.status}</StatusBadge>
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          )}

          {selected.length > 0 && (
            <ChipList
              items={selected.map((student) => ({ id: student.id, label: student.name }))}
              onRemove={(id) => setSelected((prev) => prev.filter((student) => student.id !== id))}
            />
          )}
        </Field>
      </div>
    </FormDialog>
  );
}
