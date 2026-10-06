import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/templates/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { InfoGrid } from '@/components/common/InfoGrid'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StudentExamTab } from '@/components/students/StudentExamTab'
import { StudentEditForm, type StudentEditValues } from '@/components/students/StudentEditForm'
import { StudentCounselingTab } from '@/components/students/StudentCounselingTab'
import { studentApi } from '@/api/studentApi'
import { useConfirm } from '@/hooks/useConfirm'
import { useStudentDetail } from '@/hooks/useStudentDetail'
import { STUDENT_STATUS_TONE } from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/formatDate'
import { PAGE_TEXT } from '@/lib/pageText'

export default function StudentDetailPage() {
  const { slug, studentId } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const [searchParams] = useSearchParams()
  const { student, notFound, error, loading, refetch } = useStudentDetail(studentId)
  const [submitting, setSubmitting] = useState(false)

  const listPath = `/${slug}/students`
  const detailPath = `/${slug}/students/${studentId}`
  const isEdit = searchParams.get('edit') === 'true'

  const handleSave = async (values: StudentEditValues) => {
    if (!student || !studentId) return

    // 재원 → 휴원/퇴원으로 바뀔 때만 경고한다
    if (student.status === '재원' && values.status !== '재원') {
      const ok = await confirm({
        title: '상태를 변경할까요?',
        description:
          '휴원/퇴원일 경우 이후 생성되는 시험의 응시인원에서 제외됩니다. 계속하시겠습니까?',
        confirmLabel: '계속',
      })
      if (!ok) return
    }

    setSubmitting(true)
    try {
      await studentApi.update(studentId, {
        ...values,
        classId: values.classId === '__none__' ? null : values.classId,
      })
      toast.success('수정이 완료되었습니다.')
      refetch()
      navigate(detailPath)
    } catch (e) {
      toast.error(getErrorMessage(e, '학생 정보를 수정하지 못했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!studentId) return

    const ok = await confirm({
      title: '학생을 삭제할까요?',
      description: '삭제할 경우 학생 정보가 삭제됩니다. 계속하시겠습니까?',
      confirmLabel: '삭제',
      tone: 'destructive',
    })
    if (!ok) return

    setSubmitting(true)
    try {
      await studentApi.remove(studentId)
      toast.success('학생 정보가 삭제되었습니다.')
      navigate(listPath)
    } catch (e) {
      toast.error(getErrorMessage(e, '학생 정보를 삭제하지 못했습니다.'))
      setSubmitting(false)
    }
  }

  if (!loading && !student) {
    return (
      <div>
        <PageHeader
          title="학생 상세"
          guide="학생의 기본정보, 성적, 상담 내용을 확인합니다."
          back={{ label: '학생 관리', to: listPath }}
        />
        <SectionCard>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-base font-semibold">
              {notFound ? '학생을 찾을 수 없습니다' : '학생 정보를 불러오지 못했습니다'}
            </p>
            <p className="text-sm text-muted-foreground">
              {notFound ? '삭제되었거나 존재하지 않는 학생입니다.' : error}
            </p>
            <Button type="button" variant="outline" onClick={() => navigate(listPath)}>
              학생 목록으로
            </Button>
          </div>
        </SectionCard>
      </div>
    )
  }

  return (
    <Tabs defaultValue={searchParams.get('tab') ?? 'info'}>
      <PageHeader
        title={student ? `${student.name} 학생` : '학생 상세'}
        guide={PAGE_TEXT.STUDENT_DETAIL.guide}
        back={{ label: '학생 관리', to: listPath }}
        actions={
          <TabsList>
            <TabsTrigger value="info">기본정보</TabsTrigger>
            <TabsTrigger value="scores">성적</TabsTrigger>
            <TabsTrigger value="counselings">상담</TabsTrigger>
          </TabsList>
        }
      />

      <TabsContent value="info">
        <SectionCard>
          {loading || !student ? (
            <div className="space-y-4">
              {Array.from({ length: 7 }, (_, i) => (
                <Skeleton key={i} className="h-5 w-full max-w-64" />
              ))}
            </div>
          ) : isEdit ? (
            <StudentEditForm
              key={student.id}
              student={student}
              submitting={submitting}
              onSubmit={handleSave}
              onCancel={() => navigate(detailPath)}
              onDelete={handleDelete}
            />
          ) : (
            <>
              <InfoGrid
                columns={2}
                items={[
                  { label: '이름', value: student.name },
                  { label: '학교', value: student.school },
                  { label: '학년', value: student.grade },
                  {
                    label: '반',
                    value: student.className ?? (
                      <span className="text-muted-foreground">(미배정)</span>
                    ),
                  },
                  {
                    label: '상태',
                    value: (
                      <StatusBadge tone={STUDENT_STATUS_TONE[student.status]}>
                        {student.status}
                      </StatusBadge>
                    ),
                  },
                  { label: '학부모연락처', value: student.parentPhone },
                  { label: '등록일자', value: formatDate(student.enrolledAt) },
                ]}
              />
              <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`${detailPath}?edit=true`)}
                >
                  수정
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(listPath)}>
                  목록
                </Button>
              </div>
            </>
          )}
        </SectionCard>
      </TabsContent>

      <TabsContent value="scores">
        {studentId && <StudentExamTab studentId={studentId} />}
      </TabsContent>

      <TabsContent value="counselings">
        {studentId && <StudentCounselingTab studentId={studentId} />}
      </TabsContent>
    </Tabs>
  )
}
