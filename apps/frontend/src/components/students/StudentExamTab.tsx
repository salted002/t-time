import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DataTable, type Column } from '@/components/templates/DataTable'
import { STUDENT_EXAM_PAGE_SIZE, useStudentExams } from '@/hooks/useStudentExams'
import { EVAL_TYPE_LABEL } from '@/lib/constants'
import { formatSerial, formatShortDate } from '@/lib/format'
import type { StudentExamSummary } from '@/types/studentExam'

type Row = StudentExamSummary & { serial: string }

const MEMO_MAX_LENGTH = 20

const COLUMNS: Column<Row>[] = [
  { key: 'serial', header: '번호', className: 'w-20 tabular-nums' },
  { key: 'examDate', header: '시험일자', cell: (row) => formatShortDate(row.examDate) },
  { key: 'examName', header: '시험이름', className: 'font-medium' },
  {
    key: 'className',
    header: '반',
    cell: (row) => row.className ?? <span className="text-muted-foreground">삭제된 반</span>,
  },
  { key: 'subjectCount', header: '과목수', cell: (row) => `${row.subjectCount}개` },
  { key: 'evalType', header: '평가방식', cell: (row) => EVAL_TYPE_LABEL[row.evalType] },
  {
    key: 'memo',
    header: '메모',
    cell: (row) => {
      if (!row.memo) return <span className="text-muted-foreground">-</span>
      return row.memo.length > MEMO_MAX_LENGTH ? `${row.memo.slice(0, MEMO_MAX_LENGTH)}…` : row.memo
    },
  },
]

interface StudentExamTabProps {
  studentId: string
}

// 학생상세_성적탭 (SCR-STU-EXAM-LIST)
export function StudentExamTab({ studentId }: StudentExamTabProps) {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  const { data, latestData, loading, error } = useStudentExams(studentId, page)
  const count = latestData?.count ?? 0

  const rows: Row[] = (data?.examResults ?? []).map((exam, index) => ({
    ...exam,
    serial: formatSerial(count, page, STUDENT_EXAM_PAGE_SIZE, index),
  }))

  return (
    <DataTable
      columns={COLUMNS}
      rows={rows}
      rowKey={(row) => row.examId}
      onRowClick={(row) => navigate(`/${slug}/students/${studentId}/exams/${row.examId}`)}
      loading={loading}
      empty={
        error
          ? { title: '응시한 시험을 불러오지 못했습니다', description: error }
          : {
              title: '응시한 시험이 없습니다',
              description: '시험 관리에서 시험을 만들면 이곳에 나타납니다.',
            }
      }
      pagination={{
        page,
        pageSize: STUDENT_EXAM_PAGE_SIZE,
        total: count,
        unit: '건',
        onPageChange: setPage,
      }}
    />
  )
}
