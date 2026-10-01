import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/templates/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { SearchInput } from '@/components/common/SearchInput'
import { Stepper } from '@/components/common/Stepper'
import { CheckList } from '@/components/reports/CheckList'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { reportApi } from '@/api/reportApi'
import { useFetch } from '@/hooks/useFetch'

const STEPS = ['학생 선택', '과목 선택', '생성 확인', '생성 결과']

// 리포트만들기페이지 (SCR-REPORT-BUILD ~ SCR-REPORT-CONFIRM)
// 서버는 초안을 저장하지 않으므로 선택값과 (이후) 생성 결과를 이 컴포넌트 상태로만 들고 있는다.
// 페이지를 벗어나면 사라지는 것이 의도된 동작이다.
export default function ReportBuildPage() {
  const { slug } = useParams<{ slug: string }>()

  const [step, setStep] = useState(0)
  const [studentIds, setStudentIds] = useState<string[]>([])
  const [subjectNames, setSubjectNames] = useState<string[]>([])
  const [uncheckedIds, setUncheckedIds] = useState<string[]>([]) // ③에서 사용자가 체크 해제한 학생
  const [studentSearch, setStudentSearch] = useState('')
  const [subjectSearch, setSubjectSearch] = useState('')

  // 요청은 해당 단계에 들어왔을 때만 보낸다 (key = null이면 요청 안 함)
  const students = useFetch('report-students', (signal) => reportApi.students(signal))

  const idsKey = [...studentIds].sort().join(',')
  const subjectOptions = useFetch(step >= 1 ? `subject-options:${idsKey}` : null, (signal) =>
    reportApi.subjectOptions(studentIds, signal),
  )

  const confirmKey = `${idsKey}|${[...subjectNames].sort().join(',')}`
  const batchPreview = useFetch(step >= 2 ? `batch-preview:${confirmKey}` : null, (signal) =>
    reportApi.batchPreview(studentIds, subjectNames, signal),
  )

  const allStudents = students.data ?? []
  const selectedStudents = allStudents.filter((student) => studentIds.includes(student.id))

  const studentItems = allStudents
    .filter((student) => {
      const keyword = studentSearch.trim()
      return (
        !keyword || student.name.includes(keyword) || (student.className ?? '').includes(keyword)
      )
    })
    .map((student) => ({
      id: student.id,
      label: student.name,
      description: student.className ?? '(미배정)',
    }))

  const subjectItems = (subjectOptions.data ?? [])
    .filter((name) => name.toLowerCase().includes(subjectSearch.trim().toLowerCase()))
    .map((name) => ({ id: name, label: name }))

  const candidates = batchPreview.data ?? []
  const generatable = candidates.filter((candidate) => candidate.generatable)
  const checkedCandidates = generatable.filter(
    (candidate) => !uncheckedIds.includes(candidate.studentId),
  )

  const toggleCandidate = (studentId: string) =>
    setUncheckedIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    )

  const goTo = (next: number) => {
    // 이전 단계로 돌아가면 선택이 바뀔 수 있으므로 ③의 체크 해제 기록을 초기화한다.
    if (next < step) setUncheckedIds([])
    setStep(next)
  }

  return (
    <div>
      <PageHeader
        title="리포트 만들기"
        guide="학생과 과목을 고르면 최근 10회 시험을 기준으로 리포트를 만듭니다. 저장하지 않고 나가면 만든 리포트는 사라집니다."
        back={{ label: '리포트 목록으로', to: `/${slug}/reports` }}
      />

      <SectionCard>
        <div className="mb-6">
          <Stepper steps={STEPS} current={step} />
        </div>

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <SearchInput
              value={studentSearch}
              onChange={setStudentSearch}
              placeholder="학생 이름·반으로 검색"
            />

            {students.loading ? (
              <Skeleton className="h-40 w-full" />
            ) : students.error ? (
              <p className="text-sm text-destructive">{students.error}</p>
            ) : (
              <CheckList
                items={studentItems}
                checkedIds={studentIds}
                onChange={setStudentIds}
                emptyText={
                  allStudents.length === 0 ? '재원 중인 학생이 없습니다.' : '검색 결과가 없습니다.'
                }
              />
            )}

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">선택 {studentIds.length}명</span>
              <Button type="button" disabled={studentIds.length === 0} onClick={() => goTo(1)}>
                확인
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm">
              <span className="text-muted-foreground">선택된 학생: </span>
              {selectedStudents
                .slice(0, 5)
                .map((student) => student.name)
                .join(', ')}
              {selectedStudents.length > 5 && ` 외 ${selectedStudents.length - 5}명`}
            </p>

            <SearchInput
              value={subjectSearch}
              onChange={setSubjectSearch}
              placeholder="과목 이름으로 검색"
            />

            {subjectOptions.loading ? (
              <Skeleton className="h-40 w-full" />
            ) : subjectOptions.error ? (
              <p className="text-sm text-destructive">{subjectOptions.error}</p>
            ) : (
              <CheckList
                items={subjectItems}
                checkedIds={subjectNames}
                onChange={setSubjectNames}
                emptyText={
                  (subjectOptions.data ?? []).length === 0
                    ? '선택한 학생들의 최근 응시 과목이 없습니다.'
                    : '검색 결과가 없습니다.'
                }
              />
            )}

            <div className="flex items-center justify-between border-t pt-4">
              <Button type="button" variant="outline" onClick={() => goTo(0)}>
                이전
              </Button>
              <Button type="button" disabled={subjectNames.length === 0} onClick={() => goTo(2)}>
                확인
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            {batchPreview.loading ? (
              <Skeleton className="h-40 w-full" />
            ) : batchPreview.error ? (
              <p className="text-sm text-destructive">{batchPreview.error}</p>
            ) : (
              <>
                <h2 className="text-base font-semibold">
                  생성 가능한 리포트 {generatable.length}건
                </h2>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10" />
                      <TableHead>학생이름</TableHead>
                      <TableHead>만들어질 과목</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((candidate) => (
                      <TableRow
                        key={candidate.studentId}
                        className={candidate.generatable ? undefined : 'text-muted-foreground'}
                      >
                        <TableCell>
                          <Checkbox
                            checked={
                              candidate.generatable && !uncheckedIds.includes(candidate.studentId)
                            }
                            disabled={!candidate.generatable}
                            onCheckedChange={() => toggleCandidate(candidate.studentId)}
                            aria-label={`${candidate.studentName} 선택`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {candidate.studentName}
                          {!candidate.generatable && ' (비활성)'}
                        </TableCell>
                        <TableCell>
                          {candidate.generatable
                            ? candidate.availableSubjects.join(', ')
                            : '응시 과목 없음'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

            <div className="flex items-center justify-between border-t pt-4">
              <Button type="button" variant="outline" onClick={() => goTo(1)}>
                이전
              </Button>
              {/* TODO: 생성 결과(④) 단계 구현 — checkedCandidates 학생별로 POST /reports/preview를 3개씩 동시 호출 */}
              <Button
                type="button"
                disabled={checkedCandidates.length === 0}
                onClick={() => goTo(3)}
              >
                {checkedCandidates.length}건의 리포트 생성하기
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            생성 결과 화면은 다음 단계에서 구현합니다. (선택된 학생 {checkedCandidates.length}명)
          </p>
        )}
      </SectionCard>
    </div>
  )
}
