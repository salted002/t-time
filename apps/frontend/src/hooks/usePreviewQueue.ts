import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { reportApi } from '@/api/reportApi'
import { getErrorMessage } from '@/lib/errors'
import type { ReportPreview } from '@/types/report'

// AI API 요청 한도 때문에 동시에 보낼 수 있는 미리보기 요청 수 (API 명세서 D장)
const CONCURRENCY = 3

export interface PreviewItem {
  studentId: string
  studentName: string
  status: 'loading' | 'done' | 'error'
  preview: ReportPreview | null
  error: string | null
  // 미리보기에서 사용자가 수정하는 값 (저장 시 서버로 보낸다)
  teacherFeedback: string
  aiFeedback: Record<string, string> | null
}

interface Job {
  studentId: string
}

/**
 * 학생별 리포트 미리보기를 동시에 3개씩만 요청하는 큐.
 * 결과와 수정한 피드백은 이 훅의 상태에만 있고 서버에는 저장 전까지 없다.
 */
export function usePreviewQueue() {
  const [items, setItems] = useState<PreviewItem[]>([])

  const subjectNamesRef = useRef<string[]>([])
  const queueRef = useRef<Job[]>([])
  const activeRef = useRef(0)
  const controllerRef = useRef<AbortController | null>(null)

  // 화면을 떠나면 진행 중이던 요청을 취소한다.
  useEffect(() => () => controllerRef.current?.abort(), [])

  const update = (studentId: string, patch: Partial<PreviewItem>) =>
    setItems((current) => current.map((item) => (item.studentId === studentId ? { ...item, ...patch } : item)))

  const pump = () => {
    const controller = controllerRef.current
    if (!controller) return

    while (activeRef.current < CONCURRENCY && queueRef.current.length > 0) {
      const job = queueRef.current.shift()!
      activeRef.current += 1

      reportApi
        .preview(job.studentId, subjectNamesRef.current, controller.signal)
        .then((preview) =>
          update(job.studentId, {
            status: 'done',
            preview,
            error: null,
            aiFeedback: preview.aiSubjectFeedback,
          }),
        )
        .catch((e: unknown) => {
          if (axios.isCancel(e)) return
          update(job.studentId, {
            status: 'error',
            error: getErrorMessage(e, '리포트를 생성하지 못했습니다.'),
          })
        })
        .finally(() => {
          activeRef.current -= 1
          pump()
        })
    }
  }

  const start = (students: { id: string; name: string }[], subjectNames: string[]) => {
    controllerRef.current?.abort()
    controllerRef.current = new AbortController()
    subjectNamesRef.current = subjectNames
    queueRef.current = students.map((student) => ({ studentId: student.id }))
    activeRef.current = 0

    setItems(
      students.map((student) => ({
        studentId: student.id,
        studentName: student.name,
        status: 'loading',
        preview: null,
        error: null,
        teacherFeedback: '',
        aiFeedback: null,
      })),
    )
    pump()
  }

  const retry = (studentId: string) => {
    update(studentId, { status: 'loading', error: null })
    queueRef.current.push({ studentId })
    pump()
  }

  const setTeacherFeedback = (studentId: string, value: string) => update(studentId, { teacherFeedback: value })

  const setAiFeedback = (studentId: string, subjectName: string, value: string) =>
    setItems((current) =>
      current.map((item) =>
        item.studentId === studentId
          ? { ...item, aiFeedback: { ...(item.aiFeedback ?? {}), [subjectName]: value } }
          : item,
      ),
    )

  return { items, start, retry, setTeacherFeedback, setAiFeedback }
}
