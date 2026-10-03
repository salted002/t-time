import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LOGIN_FIELD_ORDER, loginSchema } from '@/types/auth'
import type { LoginFormValues } from '@/types/auth'
import { DEMO_ACCOUNT } from '@/lib/constants'
import { FormField } from '@/components/common/FormField'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorPopup, setErrorPopup] = useState<{ title: string; messages: string[] } | null>(null)

  const { handleSubmit, control } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: true },
  })

  const handleInvalid = (formErrors: FieldErrors<LoginFormValues>) => {
    const messages = LOGIN_FIELD_ORDER.map((field) => formErrors[field]?.message).filter(
      (message): message is string => Boolean(message),
    )
    if (messages.length > 0) {
      setErrorPopup({ title: '입력 확인이 필요합니다', messages })
    }
  }
  const showLoginError = (error: unknown) => {
    const message = axios.isAxiosError(error)
      ? (error.response?.data as { message?: string } | undefined)?.message
      : undefined
    setErrorPopup({
      title: '로그인에 실패했습니다',
      messages: [message ?? '이메일 또는 비밀번호를 확인해주세요.'],
    })
  }

  const handleDemoLogin = async () => {
    setIsSubmitting(true)
    try {
      // 데모 체험은 브라우저를 닫으면 세션이 끝나도록 rememberMe를 끈다.
      const demoUser = await login(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password, false)
      navigate(`/${demoUser.academySlug}/students`)
    } catch (error) {
      showLoginError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true)
    try {
      const loggedInUser = await login(data.email, data.password, data.rememberMe)
      navigate(`/${loggedInUser.academySlug}/students`)
    } catch (error) {
      showLoginError(error)
    } finally {
      setIsSubmitting(false)
    }
  }, handleInvalid)

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="hidden flex-1 flex-col justify-center bg-[#2C4F41] px-16 py-20 lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#F3F1E9]">
            <Check className="h-4 w-4 text-[#2C4F41]" />
          </span>
          <span className="text-lg font-bold text-white">티타임</span>
        </div>
        <h1 className="mt-16 text-4xl font-bold leading-tight text-white">
          학원 운영을
          <br />
          한눈에
        </h1>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/70">
          성적 입력부터 학부모 알림톡 발송까지,
          <br />
          학원 업무를 한 곳에서 관리하세요.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-16">
        <form onSubmit={onSubmit} className="w-full max-w-[320px] space-y-5">
          {/* 이메일 필드 */}
          <FormField control={control} name="email" label="이메일(로그인 아이디)" required>
            {(field) => <Input {...field} type="email" placeholder="admin@hanbit.kr" />}
          </FormField>

          {/* 비밀번호 필드 */}
          <FormField control={control} name="password" label="비밀번호" required>
            {(field) => <Input {...field} type="password" />}
          </FormField>

          {/* 로그인 버튼 (로딩 구현) */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? '로그인 중...' : '로그인'}
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">또는</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* 데모 계정 로그인 */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isSubmitting}
            onClick={handleDemoLogin}
          >
            데모 계정으로 둘러보기
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            학원을 처음 등록하시나요?{' '}
            <Link
              to="/signup?step=academy"
              className="font-medium text-[#3F6D59] underline underline-offset-2 hover:text-[#375D4C]"
            >
              학원 계정 만들기
            </Link>
          </p>
        </form>
      </div>

      <AlertDialog open={errorPopup !== null} onOpenChange={(open) => !open && setErrorPopup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{errorPopup?.title}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {errorPopup?.messages.join('\n')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorPopup(null)}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
