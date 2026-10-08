import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import type { FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, X } from 'lucide-react'
import { api } from '@/lib/api'
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
import { ACADEMY_INFO_FIELD_ORDER, academyInfoSchema } from '@/types/academy'
import type { AcademyInfoFormValues } from '@/types/academy'
import { Card, CardContent } from '../ui/card'
import { Stepper } from '../common/Stepper'
import { FormField } from '../common/FormField'
import { PhoneInput } from '../common/PhoneInput'

interface AvailabilityResponse {
  success: boolean
  available: { slug: boolean; businessNumber: boolean }
  reasons: { slug: string | null; businessNumber: string | null }
  message: string
}

interface SignupAcademyStepProps {
  academyInfo?: AcademyInfoFormValues | null
  onNext?: (data: AcademyInfoFormValues) => void
  onCancel?: () => void
}

export default function SignupAcademyStep({
  academyInfo,
  onNext,
  onCancel,
}: SignupAcademyStepProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [errorPopup, setErrorPopup] = useState<{ title: string; messages: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { control, handleSubmit, setValue, reset } = useForm<AcademyInfoFormValues>({
    resolver: zodResolver(academyInfoSchema),
    defaultValues: academyInfo ?? {
      academyName: '',
      representativePhone: '',
      academySlug: '',
      address: '',
      businessRegistrationNumber: '',
      representativeName: '',
      smsSenderNumber: '',
    },
  })

  useEffect(() => {
    if (!academyInfo?.logo) return

    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(academyInfo.logo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setValue('logo', file, { shouldValidate: true })
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setValue('logo', undefined, { shouldValidate: true })
    setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCancel = () => {
    reset()
    setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onCancel?.()
  }

  const handleInvalid = (formErrors: FieldErrors<AcademyInfoFormValues>) => {
    const messages = ACADEMY_INFO_FIELD_ORDER.map((field) => formErrors[field]?.message).filter(
      (message): message is string => Boolean(message),
    )
    if (messages.length > 0) {
      setErrorPopup({ title: '입력 확인이 필요합니다', messages })
    }
  }

  const onSubmit = handleSubmit(async (data) => {
    setIsChecking(true)
    try {
      const response = await api.post<AvailabilityResponse>('/academies/availability', {
        slug: data.academySlug,
        businessNumber: data.businessRegistrationNumber,
      })

      const { reasons } = response.data
      const messages = [reasons.slug, reasons.businessNumber].filter((reason): reason is string =>
        Boolean(reason),
      )

      if (messages.length > 0) {
        setErrorPopup({ title: '확인이 필요합니다', messages })
        return
      }

      onNext?.(data)
    } catch {
      setErrorPopup({
        title: '오류가 발생했습니다',
        messages: ['확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'],
      })
    } finally {
      setIsChecking(false)
    }
  }, handleInvalid)

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <Card className="mx-auto w-full max-w-130 px-4 py-8">
        <CardContent>
          <div className="mb-6 px-4">
            <Stepper steps={['학원 정보', '계정 정보', '완료']} current={0} />
          </div>
          <form onSubmit={onSubmit} className="space-y-5">
            <FormField control={control} name="academyName" label="학원명" required>
              {(field) => <Input {...field} placeholder="한빛영어학원" />}
            </FormField>

            <FormField control={control} name="representativePhone" label="대표연락처" required>
              {(field) => <PhoneInput {...field} placeholder="032-123-4567" />}
            </FormField>

            <FormField
              control={control}
              name="academySlug"
              label="학원 슬러그"
              required
              description="학원 전용 주소(예: 티타임 주소/hanbit)로 사용됩니다"
            >
              {(field) => <Input {...field} placeholder="hanbit" />}
            </FormField>

            <FormField control={control} name="logo" label="학원 로고">
              {() => (
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="logo"
                    className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-muted text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="학원 로고 미리보기"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="h-5 w-5" />
                    )}
                  </label>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        이미지 업로드
                      </Button>
                      {logoPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveLogo}
                          className="text-muted-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                          삭제
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">PNG, JPG (최대 5MB, 선택 사항)</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    id="logo"
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </div>
              )}
            </FormField>

            <FormField control={control} name="address" label="주소">
              {(field) => <Input {...field} placeholder="인천 부평구 ..." />}
            </FormField>
            <FormField
              control={control}
              name="businessRegistrationNumber"
              label="사업자등록번호"
              required
            >
              {(field) => <Input {...field} placeholder="123-45-67890" />}
            </FormField>

            <FormField control={control} name="representativeName" label="대표자명" required>
              {(field) => <Input {...field} placeholder="김선주" />}
            </FormField>

            <div className="space-y-2">
              <FormField control={control} name="smsSenderNumber" label="SMS 발신번호">
                {(field) => <PhoneInput {...field} placeholder="032-123-4567" />}
              </FormField>
              <div className="rounded-lg bg-info-soft px-4 py-3 text-xs leading-relaxed text-info">
                대표 발신번호는 SMS 발신 승인 신청 시 필요하며 학원 설정에서 언제든 입력할 수
                있습니다.
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              <Button type="button" variant="outline" className="px-5" onClick={handleCancel}>
                취소
              </Button>
              <Button
                type="submit"
                disabled={isChecking}
                className="bg-[#3F6D59] px-5 text-white hover:bg-[#375D4C]"
              >
                {isChecking ? '확인 중...' : '다음 단계 →'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
