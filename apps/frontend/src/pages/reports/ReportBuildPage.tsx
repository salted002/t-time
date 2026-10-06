import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/templates/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { SearchInput } from '@/components/common/SearchInput'
import { Stepper } from '@/components/common/Stepper'
import { CheckList } from '@/components/reports/CheckList'
import { ReportViewMultiSlide } from '@/components/reports/ReportViewMultiSlide'
import { SendMultiModal } from '@/components/reports/SendMultiModal'
import { ResultCardList } from '@/components/reports/build/ResultCardList'
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
import { usePreviewQueue } from '@/hooks/usePreviewQueue'
import { getErrorMessage } from '@/lib/errors'
import type { BulkReportItem, SavedReport } from '@/types/report'
import { PAGE_TEXT } from '@/lib/pageText'

const STEPS = ['학생 선택', '과목 선택', '생성 확인', '생성 결과']

// 리포트만들기페이지 (SCR-REPORT-BUILD ~ SCR-REPORT-CONFIRM)
// 서버는 초안을 저장하지 않으므로 선택값과 (이후) 생성 결과를 이 컴포넌트 상태로만 들고 있는다.
// 페이지를 벗어나면 사라지는 것이 의도된 동작이다.
export default function ReportBuildPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [studentIds, setStudentIds] = useState<string[]>([])
  const [subjectNames, setSubjectNames] = useState<string[]>([])
  const [uncheckedIds, setUncheckedIds] = useState<string[]>([]) // ③에서 사용자가 체크 해제한 학생
  const [studentSearch, setStudentSearch] = useState('')
  const [subjectSearch, setSubjectSearch] = useState('')
  const [resultCheckedIds, setResultCheckedIds] = useState<string[]>([])
  const [openStudentId, setOpenStudentId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedReports, setSavedReports] = useState<SavedReport[] | null>(null)

  const queue = usePreviewQueue()

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

  const startGeneration = () => {
    const targets = checkedCandidates.map((candidate) => ({
      id: candidate.studentId,
      name: candidate.studentName,
    }))
    queue.start(targets, subjectNames)
    setResultCheckedIds([])
    setStep(3)
  }

  const savedCandidates = queue.items.filter(
    (item) => item.status === 'done' && resultCheckedIds.includes(item.studentId),
  )
  const hasUnsaved =
    step === 3 && !savedReports && queue.items.some((item) => item.status === 'done')

  // 새로고침·탭 닫기 시 저장하지 않은 리포트가 사라진다는 브라우저 기본 경고
  useEffect(() => {
    if (!hasUnsaved) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasUnsaved])

  const saveSelected = async () => {
    const reports: BulkReportItem[] = savedCandidates.map((item) => ({
      studentId: item.studentId,
      examIds: item.preview!.examIds,
      subjectNames: item.preview!.subjectNames,
      ...(item.teacherFeedback.trim() && { teacherFeedback: item.teacherFeedback.trim() }),
      aiFeedback: item.preview!.subscribed ? item.aiFeedback : null,
    }))

    setSaving(true)
    try {
      const saved = await reportApi.saveBulk(reports)
      toast.success(`${saved.length}건의 리포트가 저장되었습니다.`)
      setSavedReports(saved)
    } catch (e) {
      toast.error(getErrorMessage(e, '리포트를 저장하지 못했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  const openItem = queue.items.find((item) => item.studentId === openStudentId) ?? null

  return (
    <div>
      <PageHeader
        title="리포트 만들기"
        guide={PAGE_TEXT.REPORT_BUILD.guide}
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
              <Button
                type="button"
                disabled={checkedCandidates.length === 0}
                onClick={startGeneration}
              >
                {checkedCandidates.length}건의 리포트 생성하기
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <ResultCardList
              items={queue.items}
              checkedIds={resultCheckedIds}
              onCheckedChange={setResultCheckedIds}
              onOpen={setOpenStudentId}
              onRetry={queue.retry}
            />

            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-xs text-muted-foreground">
                저장하지 않고 이 화면을 나가면 만든 리포트는 사라집니다.
              </p>
              <Button
                type="button"
                disabled={savedCandidates.length === 0 || saving}
                onClick={saveSelected}
              >
                선택한 리포트 저장하기({savedCandidates.length})
              </Button>
            </div>
          </div>
        )}
      </SectionCard>

      <ReportViewMultiSlide
        item={openItem}
        onClose={() => setOpenStudentId(null)}
        onTeacherFeedbackChange={queue.setTeacherFeedback}
        onAiFeedbackChange={queue.setAiFeedback}
      />
      {savedReports && (
        <SendMultiModal reports={savedReports} onClose={() => navigate(`/${slug}/reports`)} />
      )}
    </div>
  )
}
