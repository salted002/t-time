import { api } from '@/lib/api'
import { examApi } from '@/api/examApi'
import { messageLogApi } from '@/api/messageLogApi'
import { reportApi } from '@/api/reportApi'
import { useFetch } from '@/hooks/useFetch'
import type { StudentStatus } from '@/types/student'

const RECENT_SIZE = 5

// 상태별 학생 수만 필요하므로 size=1로 요청하고 count만 읽는다. status를 생략하면 전체.
function countStudents(signal: AbortSignal, status?: StudentStatus): Promise<number> {
  return api
    .get<{ count: number }>('/students', { params: { size: 1, ...(status && { status }) }, signal })
    .then((response) => response.data.count)
}

// 대시보드 요약용 조회 (API 6 · 19 · 30 · 43). 화면이 여러 건을 한꺼번에 쓰므로 한 번에 묶는다.
export function useDashboard() {
  return useFetch('dashboard', async (signal) => {
    const [total, active, onLeave, exams, reports, messageLogs] = await Promise.all([
      countStudents(signal),
      countStudents(signal, '재원'),
      countStudents(signal, '휴원'),
      examApi.list({ q: '', page: 1, size: RECENT_SIZE }, signal),
      reportApi.list({ q: '', page: 1, size: 1 }, signal),
      messageLogApi.list({ page: 1, size: RECENT_SIZE }, signal),
    ])

    return {
      studentCount: { total, active, onLeave },
      examCount: exams.count,
      recentExams: exams.exams,
      reportCount: reports.count,
      recentMessageLogs: messageLogs.messageLogs,
    }
  })
}
