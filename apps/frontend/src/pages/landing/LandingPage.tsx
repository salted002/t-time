import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, ClipboardCheck, FileText, Send } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/common/BrandMark'
import { DEMO_ACCOUNT } from '@/lib/constants'
import { GITHUB_URL } from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'
import landingPreview from '@/assets/landing-preview-dashboard.png' // webp로 줄였다면 확장자만 바꿔요

// SCR-LANDING 서비스 소개 페이지 (로그인 상태면 학원 메인(대시보드)으로 즉시 이동)

interface Step {
  no: string
  icon: LucideIcon
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    no: '01',
    icon: ClipboardCheck,
    title: '성적 입력',
    description: '시험을 만들고 학생별 점수와 피드백을 표 하나에서 입력해요.',
  },
  {
    no: '02',
    icon: FileText,
    title: '리포트 생성',
    description:
      '입력한 성적으로 학생별 리포트를 자동으로 만들어요. 반 평균과 비교한 그래프가 함께 들어가요.',
  },
  {
    no: '03',
    icon: Send,
    title: '학부모 발송',
    description: '완성된 리포트를 SMS로 학부모에게 바로 보내고, 발송 이력에서 결과를 확인해요.',
  },
]

export default function LandingPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [demoLoading, setDemoLoading] = useState(false)

  if (user) {
    return <Navigate to={`/${user.academySlug}/`} replace />
  }

  // 데모 계정으로 둘러보기: 로그인 페이지의 데모 로그인과 같은 방식(브라우저를 닫으면 세션 종료)
  const handleDemo = async () => {
    setDemoLoading(true)
    try {
      const demoUser = await login(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password, false)
      navigate(`/${demoUser.academySlug}/`)
    } catch (error) {
      toast.error(getErrorMessage(error, '데모 계정으로 접속하지 못했습니다.'))
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col scroll-smooth bg-background">
      {/* 상단 내비게이션 */}
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-8 py-5">
        <BrandMark textClassName="text-brand" />

        <div className="flex gap-2">
          <Button variant="outline" size="lg" nativeButton={false} render={<Link to="/login" />}>
            로그인
          </Button>
          <Button size="lg" nativeButton={false} render={<Link to="/signup?step=academy" />}>
            회원가입
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* 히어로 */}
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-8 pt-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3.5 py-1.5 text-[13px] font-semibold text-brand-soft-foreground">
            <Check className="size-3.5" />
            시험 채점부터 학부모 리포트 발송까지
          </span>
          <h1 className="mt-5 text-[clamp(2.125rem,5.2vw,3.625rem)] leading-[1.28] font-extrabold tracking-tight">
            학원 성적 관리,
            <br />더 이상{' '}
            <span className="bg-[linear-gradient(transparent_62%,rgba(201,163,78,0.45)_62%)] px-1">
              엑셀로
            </span>{' '}
            하지 마세요
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
            시험 채점부터 학부모 리포트 발송까지, 티타임 하나로 끝납니다.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="h-13 px-7 text-base"
              nativeButton={false}
              render={<Link to="/signup?step=academy" />}
            >
              무료로 시작하기
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 px-7 text-base"
              disabled={demoLoading}
              onClick={handleDemo}
            >
              데모로 둘러보기
            </Button>
          </div>
          <p className="mt-3.5 text-[13px] text-muted-foreground">
            FREE 플랜으로 바로 시작할 수 있어요.
          </p>
        </section>

        {/* 제품 미리보기(스크린샷) */}
        <section className="mx-auto mt-14 w-full max-w-5xl px-8">
          <div className="overflow-hidden rounded-xl border bg-card shadow-[0_24px_60px_-20px_rgba(36,79,65,0.35)]">
            <div className="flex items-center gap-1.5 border-b bg-muted/60 px-4 py-3" aria-hidden>
              <span className="size-2.5 rounded-full bg-[#E6B0A8]" />
              <span className="size-2.5 rounded-full bg-[#E8D08A]" />
              <span className="size-2.5 rounded-full bg-[#A9CDB8]" />
            </div>
            <img
              src={landingPreview}
              alt="티타임 대시보드 화면: 오늘 할 일, 학생·시험·리포트 현황을 한눈에 확인합니다."
              width={1440}
              height={900}
              className="block w-full"
            />
          </div>
        </section>

        {/* 사용 단계 */}
        <section id="steps" className="mx-auto mt-24 w-full max-w-6xl scroll-mt-6 px-8">
          <div className="text-center">
            <p className="text-[13px] font-bold tracking-wider text-primary">HOW IT WORKS</p>
            <h2 className="mt-2.5 text-3xl font-extrabold tracking-tight">
              채점부터 발송까지, 세 단계면 충분해요
            </h2>
          </div>
          <div className="mt-11 grid gap-5 md:grid-cols-3">
            {STEPS.map(({ no, icon: Icon, title, description }) => (
              <div
                key={no}
                className="rounded-xl border bg-card p-7 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-foreground">
                    <Icon className="size-6" />
                  </span>
                  <span className="text-3xl font-extrabold text-border">{no}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 마무리 CTA */}
        <section id="start" className="mx-auto mt-24 w-full max-w-6xl scroll-mt-6 px-8">
          <div className="relative overflow-hidden rounded-xl bg-brand px-8 py-14 text-center text-brand-foreground">
            <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-sidebar-primary" />
            <h2 className="text-3xl font-extrabold tracking-tight">오늘부터 성적 관리를 가볍게</h2>
            <p className="mx-auto mt-3.5 max-w-md text-[15px] leading-relaxed text-white/80">
              AI 피드백과 시험·통계·리포트 AI 분석은 구독하면 열려요.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="h-12 bg-white px-7 text-[15px] text-brand hover:bg-white/90"
                nativeButton={false}
                render={<Link to="/signup?step=academy" />}
              >
                무료로 시작하기
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/45 bg-transparent px-7 text-[15px] text-white hover:bg-white/10 hover:text-white"
                nativeButton={false}
                render={<Link to="/login" />}
              >
                로그인
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-8 pt-10 pb-12 text-xs text-muted-foreground">
        <span>© 2026 티타임(T-Time) · All rights reserved.</span>
        <span aria-hidden>·</span>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary-hover hover:underline"
        >
          <GithubMark className="size-4" />
          GitHub
        </a>
      </footer>
    </div>
  )
}

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.921.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}
