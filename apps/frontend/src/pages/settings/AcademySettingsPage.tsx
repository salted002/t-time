import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { Settings, ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/templates/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useAuthMe } from '@/hooks/useAuthMe'
import { useConfirm } from '@/hooks/useConfirm'
import { api, getToken } from '@/lib/api'
import { academySettingsSchema } from '@/types/academy'
import type { AcademySettingsFormValues } from '@/types/academy'
import { PAGE_TEXT } from '@/lib/pageText'

const FORM_ID = 'academy-settings-form'

export default function AcademySettingsPage() {
  const navigate = useNavigate()
  const { user, setSession, logout } = useAuth()
  const { me } = useAuthMe()
  const confirm = useConfirm()
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { dirtyFields },
  } = useForm<AcademySettingsFormValues>({
    resolver: zodResolver(academySettingsSchema),
    values: {
      representativePhone: me?.academy.phone ?? '',
      address: me?.academy.address ?? '',
      academySlug: me?.academy.slug ?? '',
      smsSenderNumber: me?.academy.smsSenderNumber ?? '',
    },
  })

  const currentLogo = logoPreview ?? me?.academy.logoUrl ?? null

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setValue('logo', file, { shouldValidate: true, shouldDirty: true })
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleCancelLogo = () => {
    setValue('logo', undefined, { shouldValidate: true })
    setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = handleSubmit(async (data) => {
    // 바꾼 항목만 전송 (비워둔 항목이 기존 값을 덮어쓰지 않도록)
    const formData = new FormData()
    if (dirtyFields.representativePhone) formData.append('phone', data.representativePhone ?? '')
    if (dirtyFields.address) formData.append('address', data.address ?? '')
    if (dirtyFields.academySlug) formData.append('slug', data.academySlug)
    if (dirtyFields.smsSenderNumber) formData.append('senderNumber', data.smsSenderNumber ?? '')
    if (data.logo) formData.append('logo', data.logo)

    if ([...formData.keys()].length === 0) {
      toast.info('변경된 내용이 없습니다.')
      return
    }

    setSaving(true)
    try {
      const response = await api.patch<{ academy: { slug: string } }>('/academy', formData)
      const nextSlug = response.data.academy.slug
      toast.success('학원 정보가 수정되었습니다.')

      reset(undefined, { keepValues: true })
      if (user && nextSlug !== user.academySlug) {
        const token = getToken()
        if (token) {
          const persist = Boolean(localStorage.getItem('ttime_token'))
          setSession({ ...user, academySlug: nextSlug }, token, persist)
        }
        navigate(`/${nextSlug}/settings`, { replace: true })
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setError('academySlug', { message: '이미 사용 중인 슬러그입니다.' })
      } else {
        toast.error('수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setSaving(false)
    }
  })

  const handleDelete = async () => {
    const ok = await confirm({
      title: '학원 계정을 삭제할까요?',
      description:
        '삭제하면 이 학원과 소속 계정으로 더 이상 로그인할 수 없습니다. 이 작업은 되돌릴 수 없습니다.',
      confirmLabel: '삭제하기',
      tone: 'destructive',
    })
    if (!ok) return

    setDeleting(true)
    try {
      await api.delete('/academy')
      logout()
      // 로그아웃으로 ProtectedRoute가 /login으로 보내는 동작과 겹치지 않도록 전체 이동한다
      window.location.replace('/')
    } catch {
      toast.error('학원 계정 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="학원 설정"
        icon={Settings}
        {...PAGE_TEXT.ACADEMY_SETTINGS}
        actions={
          <>
            <Button type="submit" form={FORM_ID} disabled={saving || deleting}>
              {saving ? '저장 중...' : '저장'}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? '삭제 중...' : '삭제'}
            </Button>
          </>
        }
      />

      <SectionCard title="기본 정보">
        <form id={FORM_ID} onSubmit={onSubmit} className="max-w-xl space-y-5">
          <FormField control={control} name="logo" label="학원 로고">
            {() => (
              <div className="flex items-center gap-3">
                <label
                  htmlFor="logo"
                  className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-muted text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  {currentLogo ? (
                    <img src={currentLogo} alt="학원 로고" className="h-full w-full object-cover" />
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
                        onClick={handleCancelLogo}
                        className="text-muted-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                        취소
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG (최대 5MB)</p>
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

          <FormField control={control} name="representativePhone" label="대표 연락처">
            {(field) => <Input {...field} placeholder="032-123-4567" />}
          </FormField>

          <FormField control={control} name="address" label="주소">
            {(field) => <Input {...field} placeholder="인천 부평구 ..." />}
          </FormField>

          <FormField
            control={control}
            name="academySlug"
            label="학원 슬러그"
            required
            description="영문 소문자·숫자·하이픈만 사용할 수 있으며, 변경하면 접속 주소가 바뀝니다."
          >
            {(field) => <Input {...field} placeholder="hanbit" />}
          </FormField>

          <FormField control={control} name="smsSenderNumber" label="대표번호 (SMS 발신번호)">
            {(field) => <Input {...field} placeholder="032-123-4567" />}
          </FormField>
        </form>
      </SectionCard>
    </div>
  )
}
