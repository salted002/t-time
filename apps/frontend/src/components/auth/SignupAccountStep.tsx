import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ACCOUNT_INFO_FIELD_ORDER, accountInfoSchema } from '@/types/account'
import type { AccountInfoFormValues } from '@/types/account'
import type { AcademyInfoFormValues } from '@/types/academy'
import { Card, CardContent } from '../ui/card'
import { Stepper } from '../common/Stepper'
import { FormField } from '../common/FormField'
import { Checkbox } from '../ui/checkbox'
interface SignupResponse {
  success: boolean
  academy: { id: string; name: string; slug: string }
  user: { id: string; name: string; email: string }
  token: string
  message: string
}

interface SignupAccountStepProps {
  academyInfo: AcademyInfoFormValues | null
  onPrev?: () => void
  onSuccess?: (result: { academyName: string; message: string; slug: string }) => void
}

export default function SignupAccountStep({
  academyInfo,
  onPrev,
  onSuccess,
}: SignupAccountStepProps) {
  const { setSession } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorPopup, setErrorPopup] = useState<{ title: string; messages: string[] } | null>(null)
  const [showTerms, setShowTerms] = useState(false)

  useEffect(() => {
    if (!academyInfo) onPrev?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { handleSubmit, control } = useForm<AccountInfoFormValues>({
    resolver: zodResolver(accountInfoSchema),
    defaultValues: { privacyConsent: true },
  })

  const handleInvalid = (formErrors: FieldErrors<AccountInfoFormValues>) => {
    const messages = ACCOUNT_INFO_FIELD_ORDER.map((field) => formErrors[field]?.message).filter(
      (message): message is string => Boolean(message),
    )
    if (messages.length > 0) {
      setErrorPopup({ title: '입력 확인이 필요합니다', messages })
    }
  }

  const onSubmit = handleSubmit(async (data) => {
    if (!academyInfo) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('academyName', academyInfo.academyName)
      formData.append('businessNumber', academyInfo.businessRegistrationNumber)
      formData.append('ownerName', academyInfo.representativeName ?? '')
      formData.append('phone', academyInfo.representativePhone)
      formData.append('slug', academyInfo.academySlug)
      if (academyInfo.address) formData.append('address', academyInfo.address)
      if (academyInfo.smsSenderNumber) formData.append('senderNumber', academyInfo.smsSenderNumber)
      if (academyInfo.logo) formData.append('logo', academyInfo.logo)
      formData.append('name', data.name)
      formData.append('email', data.email)
      formData.append('password', data.password)
      formData.append('passwordConfirm', data.passwordConfirm)

      const response = await api.post<SignupResponse>('/academies/signup', formData)
      const { academy, user, token } = response.data

      setSession(
        { id: user.id, name: user.name, email: user.email, academySlug: academy.slug },
        token,
        true,
      )

      onSuccess?.({ academyName: academy.name, message: response.data.message, slug: academy.slug })
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message
        : undefined
      setErrorPopup({
        title: '학원 개설에 실패했습니다',
        messages: [message ?? '잠시 후 다시 시도해주세요.'],
      })
    } finally {
      setIsSubmitting(false)
    }
  }, handleInvalid)

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <Card className="mx-auto w-full max-w-130 px-4 py-8">
        <CardContent>
          <div className="mb-6 px-2">
            <Stepper steps={['학원 정보', '계정 정보', '완료']} current={1} />
          </div>
          <form onSubmit={onSubmit} className="space-y-5">
            <FormField control={control} name="name" label="관리자 이름" required>
              {(field) => <Input {...field} placeholder="김선주" />}
            </FormField>

            <FormField control={control} name="email" label="이메일(로그인 아이디)" required>
              {(field) => <Input {...field} type="email" placeholder="admin@hanbit.kr" />}
            </FormField>

            <FormField control={control} name="password" label="비밀번호" required>
              {(field) => <Input {...field} type="password" />}
            </FormField>

            <FormField control={control} name="passwordConfirm" label="비밀번호 확인" required>
              {(field) => <Input {...field} type="password" />}
            </FormField>

            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="privacyConsent"
                render={({ field }) => (
                  <Checkbox
                    id="privacyConsent"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="privacyConsent" className="gap-1 text-sm font-normal text-foreground">
                <span className="font-semibold text-foreground">[필수]</span> 개인정보 수집·이용
                동의
              </Label>
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-sm text-primary underline underline-offset-2 hover:text-primary-hover"
              >
                보기
              </button>
            </div>

            <div className="flex items-center justify-between pt-3">
              <Button type="button" variant="outline" className="px-5" onClick={onPrev}>
                ← 이전
              </Button>
              <Button type="submit" disabled={isSubmitting} className="px-5">
                {isSubmitting ? '처리 중...' : '학원 개설하기'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={showTerms} onOpenChange={setShowTerms}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>개인정보 수집·이용 동의</AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              수집 항목: 이름, 이메일, 학원 정보 등 회원가입 시 입력한 정보
              <br />
              수집 목적: 회원 식별 및 서비스 제공
              <br />
              보유 기간: 회원 탈퇴 시까지
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowTerms(false)}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
