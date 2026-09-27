import { useState } from 'react'

import { StatusBadge } from '@/components/common/StatusBadge'
import { DataTable, type Column } from '@/components/templates/DataTable'
import { STUDENT_STATUS_TONE } from '@/lib/constants'
import type { Student } from '@/types/student'

const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: '김도윤',
    classId: 'c1',
    className: '중등 심화 A',
    status: '재원',
    school: '부평중',
    grade: '중1',
    parentPhone: '010-3322-5544',
    enrolledAt: '2026-08-30',
  },
  {
    id: '2',
    name: '윤채원',
    classId: 'c2',
    className: '중등 기초 C',
    status: '휴원',
    school: '산곡중',
    grade: '중3',
    parentPhone: '010-1234-5678',
    enrolledAt: '2026-03-02',
  },
  {
    id: '3',
    name: '문지호',
    classId: null,
    className: null,
    status: '퇴원',
    school: '부평고',
    grade: '고1',
    parentPhone: '010-2244-6688',
    enrolledAt: null,
  },
]

const studentColumns: Column<Student>[] = [
  { key: 'name', header: '이름', className: 'font-medium' },
  { key: 'className', header: '반', cell: (s) => s.className ?? '(미배정)' },
  {
    key: 'status',
    header: '상태',
    cell: (s) => <StatusBadge tone={STUDENT_STATUS_TONE[s.status]}>{s.status}</StatusBadge>,
  },
  { key: 'school', header: '학교' },
  { key: 'grade', header: '학년' },
  { key: 'parentPhone', header: '학부모연락처' },
  { key: 'enrolledAt', header: '등록일자' },
]

export default function ComponentsPage() {
  const [page, setPage] = useState(1)
  const [clicked, setClicked] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-5xl space-y-12 p-8">
      <h1 className="text-xl font-bold">공통 컴포넌트 미리보기</h1>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">StatusBadge</h2>
        <div className="flex gap-2">
          <StatusBadge tone={STUDENT_STATUS_TONE['재원']}>재원</StatusBadge>
          <StatusBadge tone={STUDENT_STATUS_TONE['휴원']}>휴원</StatusBadge>
          <StatusBadge tone={STUDENT_STATUS_TONE['퇴원']}>퇴원</StatusBadge>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">
          DataTable · 데이터 있음 + 행 클릭 + 페이지네이션
        </h2>
        <p className="text-sm text-muted-foreground">마지막으로 클릭한 행: {clicked ?? '없음'}</p>
        <DataTable
          columns={studentColumns}
          rows={MOCK_STUDENTS}
          rowKey={(s) => s.id}
          onRowClick={(s) => setClicked(s.name)}
          pagination={{ page, pageSize: 20, total: 128, unit: '명', onPageChange: setPage }}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">DataTable · 빈 목록</h2>
        <DataTable
          columns={studentColumns}
          rows={[]}
          rowKey={(s) => s.id}
          empty={{
            title: '등록된 학생이 없어요',
            description: '오른쪽 위 [학생 등록]으로 첫 학생을 추가해 보세요.',
          }}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">DataTable · 로딩</h2>
        <DataTable columns={studentColumns} rows={[]} rowKey={(s) => s.id} loading />
      </section>
    </div>
  )
}
