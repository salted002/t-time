import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { PageHeader } from '@/components/templates/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { InfoGrid } from '@/components/common/InfoGrid'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StudentExamTab } from '@/components/students/StudentExamTab'
import { useStudentDetail } from '@/hooks/useStudentDetail'
import { STUDENT_STATUS_TONE } from '@/lib/constants'
import { formatDate } from '@/lib/formatDate'

export default function StudentDetailPage() {
  const { slug, studentId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { student, notFound, error, loading } = useStudentDetail(studentId)

  const listPath = `/${slug}/students`

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
        guide="학생의 기본정보, 성적, 상담 내용을 확인합니다."
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
              <div className="mt-6 flex justify-end border-t pt-4">
                {/* 수정 폼은 다음 작업에서 연결 */}
                <Button type="button" variant="outline" disabled>
                  수정
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
        <SectionCard>
          <p className="py-10 text-center text-sm text-muted-foreground">
            상담 탭은 준비 중입니다.
          </p>
        </SectionCard>
      </TabsContent>
    </Tabs>
  )
}
