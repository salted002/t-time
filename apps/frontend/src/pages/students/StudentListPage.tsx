import { useMemo, useState } from 'react';
import { Check, ChevronDown, HelpCircle, Plus, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { MockStudent, StudentStatus } from '@/pages/students/mockStudents';
import { MOCK_STUDENTS } from '@/pages/students/mockStudents';

const PAGE_SIZE = 20;

const STATUS_FILTERS: { label: string; value: StudentStatus | 'all' }[] = [
  { label: '전체', value: 'all' },
  { label: '재원생', value: '재원' },
  { label: '휴원생', value: '휴원' },
  { label: '퇴원생', value: '퇴원' },
];

const STATUS_BADGE_STYLES: Record<StudentStatus, string> = {
  재원: 'bg-green-50 text-green-700',
  휴원: 'bg-amber-50 text-amber-700',
  퇴원: 'bg-gray-100 text-gray-500',
};

const STATUS_DOT_STYLES: Record<StudentStatus, string> = {
  재원: 'bg-green-500',
  휴원: 'bg-amber-500',
  퇴원: 'bg-gray-400',
};

const NAV_GROUPS = [
  {
    label: '학사 관리',
    items: [
      { label: '학생 관리', active: true },
      { label: '시험 관리', active: false },
      { label: '리포트 관리', active: false },
      { label: '반 관리', active: false },
    ],
  },
  {
    label: '발송 관리',
    items: [
      { label: '템플릿 관리', active: false },
      { label: '발송 이력', active: false },
    ],
  },
  {
    label: '설정',
    items: [
      { label: '구독 관리', active: false },
      { label: '학원 설정', active: false },
    ],
  },
];

function StatusBadge({ status }: { status: StudentStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_STYLES[status]}`}
    >
      {status !== '퇴원' && (
        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_STYLES[status]}`} />
      )}
      {status}
    </span>
  );
}

export default function StudentListPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all');
  const [classFilter, setClassFilter] = useState('all');
  const [page, setPage] = useState(1);

  const classOptions = useMemo(
    () => Array.from(new Set(MOCK_STUDENTS.map((s) => s.className).filter((c): c is string => Boolean(c)))),
    []
  );

  const filteredStudents = useMemo(() => {
    return MOCK_STUDENTS.filter((student) => {
      const matchesSearch = student.name.includes(search.trim());
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      const matchesClass = classFilter === 'all' || student.className === classFilter;
      return matchesSearch && matchesStatus && matchesClass;
    });
  }, [search, statusFilter, classFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageStudents = filteredStudents.slice(pageStart, pageStart + PAGE_SIZE);
  const rangeStart = filteredStudents.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + PAGE_SIZE, filteredStudents.length);

  const initial = user?.name?.slice(0, 1) ?? '';

  return (
    <div className="flex min-h-screen bg-[#F3F1E9]">
      <aside className="flex w-64 shrink-0 flex-col bg-[#2C4F41] text-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#F3F1E9]">
            <Check className="h-4 w-4 text-[#2C4F41]" />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">한빛영어학원</p>
            <p className="text-xs leading-tight text-white/60">관리자</p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-xs font-medium text-white/40">{group.label}</p>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      item.active
                        ? 'bg-white/10 font-semibold text-white'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2 border-t border-white/10 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
            {initial}
          </span>
          <p className="text-sm text-white/80">{user?.name} · 관리자</p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <p className="text-sm text-gray-700">{user?.name} 관리자님, 안녕하세요</p>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2C4F41] text-sm font-semibold text-white">
            {initial}
          </span>
        </header>

        <main className="flex-1 px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold text-gray-900">학생 관리</h1>
                <HelpCircle className="h-4 w-4 text-gray-400" />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                재원·휴원·퇴원 학생을 한 목록에서 관리합니다.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline">
                일괄 등록
              </Button>
              <Button type="button" className="bg-[#3F6D59] text-white hover:bg-[#375D4C]">
                <Plus className="h-4 w-4" />
                학생 등록
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="relative w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="학생 이름으로 검색"
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(filter.value);
                    setPage(1);
                  }}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    statusFilter === filter.value
                      ? 'bg-[#2C4F41] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <select
                value={classFilter}
                onChange={(event) => {
                  setClassFilter(event.target.value);
                  setPage(1);
                }}
                className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm text-gray-700"
              >
                <option value="all">반 전체</option>
                {classOptions.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="px-6 py-3 font-medium">이름</th>
                  <th className="px-6 py-3 font-medium">반</th>
                  <th className="px-6 py-3 font-medium">상태</th>
                  <th className="px-6 py-3 font-medium">학교</th>
                  <th className="px-6 py-3 font-medium">학년</th>
                  <th className="px-6 py-3 font-medium">학부모연락처</th>
                  <th className="px-6 py-3 font-medium">등록일자</th>
                </tr>
              </thead>
              <tbody>
                {pageStudents.map((student: MockStudent) => (
                  <tr key={student.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-6 py-3.5 font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {student.className ?? <span className="text-gray-400">(미배정)</span>}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={student.status} />
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">{student.school}</td>
                    <td className="px-6 py-3.5 text-gray-600">{student.grade}</td>
                    <td className="px-6 py-3.5 text-gray-600">{student.parentPhone}</td>
                    <td className="px-6 py-3.5 text-gray-600">{student.enrolledAt}</td>
                  </tr>
                ))}
                {pageStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      조건에 맞는 학생이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <p>
              전체 {filteredStudents.length}명 중 {rangeStart}–{rangeEnd}명 표시
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                이전
              </Button>
              <span className="text-xs text-gray-400">
                {currentPage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                다음
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
