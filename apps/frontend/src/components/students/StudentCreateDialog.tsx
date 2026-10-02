import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'

import { DatePicker } from '@/components/common/DatePicker'
import { FormDialog } from '@/components/common/FormDialog'
import { FormField } from '@/components/common/FormField'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { studentApi } from '@/api/studentApi'
import { useClassList } from '@/hooks/useClassList'
import { STUDENT_STATUS_TONE } from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'
import type { StudentStatus } from '@/types/student'

const NO_CLASS = '__none__'
const STATUS_ITEMS = (Object.keys(STUDENT_STATUS_TONE) as StudentStatus[]).map((status) => ({
  value: status,
  label: status,
}))

const studentCreateSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해주세요.'),
  classId: z.string(),
  status: z.enum(['재원', '휴원', '퇴원']),
  school: z.string().trim().min(1, '학교를 입력해주세요.'),
  grade: z.string().trim().min(1, '학년을 입력해주세요.'),
  parentPhone: z.string().trim().min(1, '학부모 연락처를 입력해주세요.'),
  enrolledAt: z.string().nullable(),
})

type StudentCreateValues = z.infer<typeof studentCreateSchema>

interface StudentCreateDialogProps {
  onClose: () => void
  onCreated: (studentId: string) => void
}

export function StudentCreateDialog({ onClose, onCreated }: StudentCreateDialogProps) {
  const { classes } = useClassList()
  const form = useForm<StudentCreateValues>({
    resolver: zodResolver(studentCreateSchema),
    defaultValues: {
      name: '',
      classId: NO_CLASS,
      status: '재원',
      school: '',
      grade: '',
      parentPhone: '',
      enrolledAt: null,
    },
  })

  const classItems = [
    { value: NO_CLASS, label: '선택 안 함' },
    ...classes.map((item) => ({ value: item.id, label: item.name })),
  ]

  const onSubmit = async (values: StudentCreateValues) => {
    try {
      const student = await studentApi.create({
        ...values,
        classId: values.classId === NO_CLASS ? null : values.classId,
      })
      toast.success('등록이 완료되었습니다.')
      onCreated(student.id)
    } catch (e) {
      toast.error(getErrorMessage(e, '학생을 등록하지 못했습니다.'))
    }
  }

  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="학생 등록"
      primary={{ label: '등록', form: 'student-form', loading: form.formState.isSubmitting }}
    >
      <form
        id="student-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-5"
      >
        <FormField control={form.control} name="name" label="이름" required>
          {(field) => <Input {...field} />}
        </FormField>

        <FormField control={form.control} name="classId" label="반">
          {(field) => (
            <Select
              items={classItems}
              value={field.value}
              onValueChange={(value) => field.onChange((value as string | null) ?? NO_CLASS)}
            >
              <SelectTrigger id={field.id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {classItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <FormField control={form.control} name="status" label="상태" required>
          {(field) => (
            <Select
              items={STATUS_ITEMS}
              value={field.value}
              onValueChange={(value) => field.onChange(value as StudentStatus)}
            >
              <SelectTrigger id={field.id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <FormField control={form.control} name="school" label="학교" required>
          {(field) => <Input {...field} />}
        </FormField>

        <FormField control={form.control} name="grade" label="학년" required>
          {(field) => <Input {...field} />}
        </FormField>

        <FormField control={form.control} name="parentPhone" label="학부모연락처" required>
          {(field) => <Input {...field} inputMode="tel" />}
        </FormField>

        <FormField control={form.control} name="enrolledAt" label="등록일자">
          {(field) => (
            <DatePicker
              id={field.id}
              value={field.value}
              onChange={field.onChange}
              placeholder="선택 안 함"
            />
          )}
        </FormField>
      </form>
    </FormDialog>
  )
}
