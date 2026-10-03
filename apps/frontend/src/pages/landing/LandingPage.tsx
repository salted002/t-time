import { Link, Navigate } from 'react-router-dom'
import { BarChart3, FileText, MessageSquareText, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/common/BrandMark'

// SCR-LANDING 서비스 소개 페이지 (로그인 상태면 학원 메인으로 즉시 이동)

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: Users,
    title: '학생·반 관리',
    description: '재원·휴원·퇴원 학생과 반 배정을 한 목록에서 관리해요.',
  },
  {
    icon: FileText,
    title: '시험·성적',
    description: '시험을 만들고 과목별 점수와 등급을 입력해요.',
  },
  {
    icon: BarChart3,
    title: '성적 리포트',
    description: '최근 시험 추이를 담은 리포트를 링크로 공유해요.',
  },
  {
    icon: MessageSquareText,
    title: '학부모 문자',
    description: '리포트 링크와 안내 문자를 학부모에게 바로 보내요.',
  },
]

export default function LandingPage() {
  const { user } = useAuth()

  if (user) {
    return <Navigate to={`/${user.academySlug}/`} replace />
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <Logo />
        <nav className="flex items-center gap-2">
          <Button variant="ghost" nativeButton={false} render={<Link to="/login" />}>
            로그인
          </Button>
          <Button nativeButton={false} render={<Link to="/signup?step=academy" />}>
            학원 계정 만들기
          </Button>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="flex flex-col items-center px-6 py-20 text-center md:py-28">
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            학원 운영을
            <br />
            한눈에
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            성적 입력부터 학부모 문자 발송까지,
            <br />
            학원 업무를 한 곳에서 관리하세요.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" nativeButton={false} render={<Link to="/signup?step=academy" />}>
              무료로 시작하기
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link to="/login" />}>
              로그인
            </Button>
          </div>
        </section>

        <section className="grid gap-4 px-6 pb-20 sm:grid-cols-2 md:px-12 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6"
            >
              <span className="flex size-10 items-center justify-center rounded-md bg-brand-soft text-brand-soft-foreground">
                <Icon className="size-5" />
              </span>
              <h2 className="font-semibold">{title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="bg-brand px-6 py-8 text-sm text-brand-foreground md:px-12">
        © 티타임
      </footer>
    </div>
  )
}

function Logo() {
  return <BrandMark />
}
