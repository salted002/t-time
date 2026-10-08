import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { DatePicker } from '@/components/common/DatePicker'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useClassList } from '@/hooks/useClassList'
import type { Student, StudentStatus } from '@/types/student'
import { MOBILE_REGEX, onlyDigits } from '@/lib/phone'

const STATUSES: StudentStatus[] = ['재원', '휴원', '퇴원']
const NO_CLASS = '__none__'

const studentEditSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해주세요.'),
  school: z.string().trim().min(1, '학교를 입력해주세요.'),
  grade: z.string().trim().min(1, '학년을 입력해주세요.'),
  classId: z.string(),
  status: z.enum(['재원', '휴원', '퇴원']),
  parentPhone: z
    .string()
    .trim()
    .min(1, '학부모 연락처를 입력해주세요.')
    .refine((v) => MOBILE_REGEX.test(onlyDigits(v)), '올바른 휴대폰 번호를 입력해주세요.')
    .transform(onlyDigits),
  enrolledAt: z.string().nullable(),
})

export type StudentEditValues = z.infer<typeof studentEditSchema>

interface StudentEditFormProps {
  student: Student
  submitting: boolean
  onSubmit: (values: StudentEditValues) => void
  onCancel: () => void
  onDelete: () => void
}

export function StudentEditForm({
  student,
  submitting,
  onSubmit,
  onCancel,
  onDelete,
}: StudentEditFormProps) {
  const { classes } = useClassList()
  const { control, handleSubmit } = useForm<StudentEditValues>({
    resolver: zodResolver(studentEditSchema),
    defaultValues: {
      name: student.name,
      school: student.school,
      grade: student.grade,
      classId: student.classId ?? NO_CLASS,
      status: student.status,
      parentPhone: student.parentPhone,
      enrolledAt: student.enrolledAt ? student.enrolledAt.slice(0, 10) : null,
    },
  })

  const classItems = [
    { value: NO_CLASS, label: '(미배정)' },
    ...classes.map((c) => ({ value: c.id, label: c.name })),
  ]
  const statusItems = STATUSES.map((s) => ({ value: s, label: s }))

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <FormField control={control} name="name" label="이름" required>
          {(field) => <Input {...field} />}
        </FormField>

        <FormField control={control} name="school" label="학교" required>
          {(field) => <Input {...field} />}
        </FormField>

        <FormField control={control} name="grade" label="학년" required>
          {(field) => <Input {...field} />}
        </FormField>

        <FormField control={control} name="classId" label="반">
          {(field) => (
            <Select
              items={classItems}
              value={field.value}
              onValueChange={(value) => field.onChange((value as string | null) ?? NO_CLASS)}
            >
              <SelectTrigger id={field.id} className="w-full">
                <SelectValue placeholder="반 선택" />
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

        <FormField control={control} name="status" label="상태" required>
          {(field) => (
            <Select
              items={statusItems}
              value={field.value}
              onValueChange={(value) => field.onChange(value as StudentStatus)}
            >
              <SelectTrigger id={field.id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <FormField control={control} name="parentPhone" label="학부모연락처" required>
          {(field) => <Input {...field} />}
        </FormField>

        <FormField control={control} name="enrolledAt" label="등록일자">
          {(field) => <DatePicker id={field.id} value={field.value} onChange={field.onChange} />}
        </FormField>
      </div>

      <div className="mt-6 flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          취소
        </Button>
        <Button type="submit" disabled={submitting}>
          저장
        </Button>
        <Button type="button" variant="destructive" onClick={onDelete} disabled={submitting}>
          삭제
        </Button>
      </div>
    </form>
  )
}
