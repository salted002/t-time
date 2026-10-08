import { useState } from 'react'
import { useMatch, useNavigate, useParams } from 'react-router-dom'
import { Check, Plus, Users } from 'lucide-react'
import { PageHeader } from '@/components/templates/PageHeader'
import { DataTable, type Column } from '@/components/templates/DataTable'
import { FilterBar } from '@/components/common/FilterBar'
import { SearchInput } from '@/components/common/SearchInput'
import { StatusBadge } from '@/components/common/StatusBadge'
import { InitialAvatar } from '@/components/common/InitialAvatar'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StudentBulkImportModal } from '@/components/students/StudentBulkImportModal'
import { StudentCreateDialog } from '@/components/students/StudentCreateDialog'
import { useClassList } from '@/hooks/useClassList'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { STUDENT_PAGE_SIZE, useStudentList } from '@/hooks/useStudentList'
import { STUDENT_STATUS_TONE } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Student, StudentStatus } from '@/types/student'
import { PAGE_TEXT } from '@/lib/pageText'
import { formatPhone } from '@/lib/phone'

const STATUS_OPTIONS: StudentStatus[] = ['재원', '휴원', '퇴원']

const COLUMNS: Column<Student>[] = [
  {
    key: 'name',
    header: '이름',
    className: 'font-medium',
    cell: (student) => (
      <span className="flex items-center gap-2.5">
        <InitialAvatar name={student.name} />
        {student.name}
      </span>
    ),
  },
  {
    key: 'className',
    header: '반',
    cell: (student) => student.className ?? <span className="text-muted-foreground">(미배정)</span>,
  },
  {
    key: 'status',
    header: '상태',
    cell: (student) => (
      <StatusBadge tone={STUDENT_STATUS_TONE[student.status]}>{student.status}</StatusBadge>
    ),
  },
  { key: 'school', header: '학교' },
  { key: 'grade', header: '학년' },
  { key: 'parentPhone', header: '학부모연락처', cell: (s) => formatPhone(s.parentPhone) },
  { key: 'enrolledAt', header: '등록일자' },
]

export default function StudentListPage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const isCreateOpen = useMatch('/:slug/students/new') !== null
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StudentStatus[]>([])
  const [classFilter, setClassFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [isBulkOpen, setIsBulkOpen] = useState(false)

  const debouncedSearch = useDebouncedValue(search.trim())
  const { classes } = useClassList()
  const { students, count, loading, error, reload } = useStudentList({
    q: debouncedSearch,
    status: statusFilter,
    classId: classFilter,
    page,
  })

  const classItems = [
    { value: 'all', label: '반 전체' },
    ...classes.map((item) => ({ value: item.id, label: item.name })),
  ]

  const toggleStatus = (status: StudentStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    )
    setPage(1)
  }

  return (
    <div>
      <PageHeader
        title="학생 관리"
        icon={Users}
        {...PAGE_TEXT.STUDENT_LIST}
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => setIsBulkOpen(true)}>
              일괄 등록
            </Button>
            <Button type="button" onClick={() => navigate(`/${slug}/students/new`)}>
              <Plus />
              학생 등록
            </Button>
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="학생 이름으로 검색"
        />

        <div role="group" aria-label="상태 필터 (복수 선택)" className="flex gap-2">
          {STATUS_OPTIONS.map((status) => {
            const selected = statusFilter.includes(status)
            return (
              <button
                key={status}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleStatus(status)}
                className={cn(
                  'inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors',
                  selected
                    ? 'border-primary bg-brand-soft text-brand-soft-foreground'
                    : 'border-input bg-card hover:border-primary',
                )}
              >
                {selected && <Check className="size-3.5" />}
                {status}
              </button>
            )
          })}
        </div>

        <Select
          items={classItems}
          value={classFilter}
          onValueChange={(value) => {
            setClassFilter((value as string | null) ?? 'all')
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40 bg-card" aria-label="반 선택">
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
      </FilterBar>

      <DataTable
        columns={COLUMNS}
        rows={students}
        rowKey={(student) => student.id}
        onRowClick={(student) => navigate(`/${slug}/students/${student.id}`)}
        loading={loading}
        empty={
          error
            ? { title: '학생 목록을 불러오지 못했습니다', description: error }
            : { title: '조건에 맞는 학생이 없습니다', description: '검색어나 필터를 바꿔 보세요.' }
        }
        pagination={{
          page,
          pageSize: STUDENT_PAGE_SIZE,
          total: count,
          unit: '명',
          onPageChange: setPage,
        }}
      />

      {isBulkOpen && (
        <StudentBulkImportModal onClose={() => setIsBulkOpen(false)} onImported={reload} />
      )}

      {isCreateOpen && (
        <StudentCreateDialog
          onClose={() => navigate(`/${slug}/students`)}
          onCreated={(studentId) => navigate(`/${slug}/students/${studentId}`)}
        />
      )}
    </div>
  )
}
