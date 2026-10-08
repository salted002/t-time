import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { AlertTriangle, ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate, useParams } from 'react-router-dom'

import { adminApi, type AdminAcademyDetail } from '@/api/adminApi'
import { PageHeader } from '@/components/templates/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/hooks/useConfirm'
import { getErrorMessage } from '@/lib/errors'
import { adminAcademyUpdateSchema } from '@/types/adminAcademy'
import type { AdminAcademyUpdateFormValues } from '@/types/adminAcademy'
import { PhoneInput } from '@/components/common/PhoneInput'

const FORM_ID = 'admin-academy-update-form'
const LIST_PATH = '/admin/academies'

type FetchState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: AdminAcademyDetail }

// 409 메시지로 어느 필드가 중복인지 판단한다 (백엔드: 슬러그/사업자번호/이메일)
function getDuplicateField(message: string): keyof AdminAcademyUpdateFormValues | null {
  if (message.includes('슬러그')) return 'academySlug'
  if (message.includes('사업자번호')) return 'businessRegistrationNumber'
  if (message.includes('이메일')) return 'userEmail'
  return null
}

// 개별 학원 수정 (SCR-ADMIN-ACADEMY-UPDATE)
export default function AdminAcademyEditPage() {
  const { academyId = '' } = useParams<{ academyId: string }>()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'loading' })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const detail = fetchState.status === 'ready' ? fetchState.data : null

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { dirtyFields },
  } = useForm<AdminAcademyUpdateFormValues>({
    resolver: zodResolver(adminAcademyUpdateSchema),
    values: {
      academyName: detail?.academy.name ?? '',
      academySlug: detail?.academy.slug ?? '',
      representativePhone: detail?.academy.phone ?? '',
      address: detail?.academy.address ?? '',
      businessRegistrationNumber: detail?.academy.businessNumber ?? '',
      representativeName: detail?.academy.ownerName ?? '',
      smsSenderNumber: detail?.academy.smsSenderNumber ?? '',
      userName: detail?.user?.name ?? '',
      userEmail: detail?.user?.email ?? '',
      userPassword: '',
    },
  })

  useEffect(() => {
    let ignore = false

    adminApi
      .getAcademy(academyId)
      .then((data) => {
        if (!ignore) setFetchState({ status: 'ready', data })
      })
      .catch((e: unknown) => {
        if (ignore) return
        if (axios.isAxiosError(e) && e.response?.status === 401) {
          navigate('/admin/login', { replace: true })
          return
        }
        setFetchState({
          status: 'error',
          message: getErrorMessage(e, '학원 정보를 불러오지 못했습니다.'),
        })
      })

    return () => {
      ignore = true
    }
  }, [academyId, navigate])

  const currentLogo = logoPreview ?? detail?.academy.logoUrl ?? null

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

  const handleApiError = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      if (status === 401) {
        navigate('/admin/login', { replace: true })
        return
      }
      if (status === 409) {
        const message = getErrorMessage(error, '이미 사용 중인 값입니다.')
        const field = getDuplicateField(message)
        if (field) {
          setError(field, { message })
          return
        }
      }
    }
    toast.error(getErrorMessage(error, fallback))
  }

  const onSubmit = handleSubmit(async (data) => {
    // 바꾼 항목만 전송 (비워둔 항목이 기존 값을 덮어쓰지 않도록)
    const formData = new FormData()
    if (dirtyFields.academyName) formData.append('name', data.academyName)
    if (dirtyFields.academySlug) formData.append('slug', data.academySlug)
    if (dirtyFields.representativePhone) formData.append('phone', data.representativePhone)
    if (dirtyFields.address) formData.append('address', data.address ?? '')
    if (dirtyFields.businessRegistrationNumber) {
      formData.append('businessNumber', data.businessRegistrationNumber)
    }
    if (dirtyFields.representativeName) formData.append('ownerName', data.representativeName)
    if (dirtyFields.smsSenderNumber) formData.append('senderNumber', data.smsSenderNumber ?? '')
    if (data.logo) formData.append('logo', data.logo)
    if (dirtyFields.userName) formData.append('userName', data.userName)
    if (dirtyFields.userEmail) formData.append('userEmail', data.userEmail)
    // 비밀번호는 비워두면 변경하지 않는다
    if (data.userPassword) formData.append('userPassword', data.userPassword)

    if ([...formData.keys()].length === 0) {
      toast.info('변경된 내용이 없습니다.')
      return
    }

    setSaving(true)
    try {
      await adminApi.updateAcademy(academyId, formData)
      toast.success('학원 정보가 수정되었습니다.')
      navigate(LIST_PATH, { replace: true })
    } catch (error) {
      handleApiError(error, '수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      setSaving(false)
    }
  })

  const handleDelete = async () => {
    const ok = await confirm({
      title: '학원 삭제',
      description: '학원 정보가 영구 삭제됩니다. 진행하시겠습니까?',
      confirmLabel: '삭제하기',
      tone: 'destructive',
    })
    if (!ok) return

    setDeleting(true)
    try {
      await adminApi.deleteAcademy(academyId)
      toast.success('학원 정보가 삭제되었습니다.')
      navigate(LIST_PATH, { replace: true })
    } catch (error) {
      handleApiError(error, '학원 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      setDeleting(false)
    }
  }

  const title = detail ? `${detail.academy.name} 수정` : '학원 수정'
  const busy = saving || deleting

  return (
    <div>
      <PageHeader
        title={title}
        guide="학원 정보와 관리자 계정 정보를 수정합니다. 바꾼 항목만 저장됩니다."
        description="비밀번호를 비워두면 기존 비밀번호가 유지됩니다."
        back={{ label: '학원 목록', to: LIST_PATH }}
        actions={
          <>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={!detail || busy}
            >
              <AlertTriangle />
              {deleting ? '삭제 중...' : '학원 삭제'}
            </Button>
            <Button type="submit" form={FORM_ID} disabled={!detail || busy}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </>
        }
      />

      {fetchState.status === 'loading' && (
        <div className="flex max-w-xl flex-col gap-4" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {fetchState.status === 'error' && (
        <SectionCard title="학원 정보를 불러오지 못했습니다" description={fetchState.message}>
          <Button type="button" variant="outline" onClick={() => navigate(LIST_PATH)}>
            목록으로 돌아가기
          </Button>
        </SectionCard>
      )}

      {detail && (
        <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex max-w-xl flex-col gap-6">
          <SectionCard title="학원 정보">
            <div className="space-y-5">
              <FormField control={control} name="academyName" label="학원명" required>
                {(field) => <Input {...field} placeholder="한빛영어학원" />}
              </FormField>

              <FormField
                control={control}
                name="academySlug"
                label="슬러그"
                required
                description="영문 소문자·숫자·하이픈만 사용할 수 있으며, 변경하면 학원 접속 주소가 바뀝니다."
              >
                {(field) => <Input {...field} placeholder="hanbit" />}
              </FormField>

              <FormField control={control} name="representativePhone" label="대표연락처" required>
                {(field) => <PhoneInput {...field} placeholder="032-123-4567" />}
              </FormField>

              <FormField control={control} name="address" label="주소">
                {(field) => <Input {...field} placeholder="인천 부평구 ..." />}
              </FormField>

              <FormField
                control={control}
                name="businessRegistrationNumber"
                label="사업자번호"
                required
              >
                {(field) => <Input {...field} placeholder="123-45-67890" />}
              </FormField>

              <FormField control={control} name="representativeName" label="대표자명" required>
                {(field) => <Input {...field} placeholder="김선주" />}
              </FormField>

              <FormField control={control} name="logo" label="학원로고">
                {() => (
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="logo"
                      className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-muted text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                    >
                      {currentLogo ? (
                        <img
                          src={currentLogo}
                          alt="학원 로고"
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

              <FormField control={control} name="smsSenderNumber" label="대표 발신번호">
                {(field) => <PhoneInput {...field} placeholder="010-2345-6789" />}
              </FormField>
            </div>
          </SectionCard>

          <SectionCard title="관리자 정보">
            <div className="space-y-5">
              <FormField control={control} name="userName" label="관리자 이름" required>
                {(field) => <Input {...field} placeholder="김선주" />}
              </FormField>

              <FormField control={control} name="userEmail" label="로그인 이메일" required>
                {(field) => <Input {...field} type="email" placeholder="admin@example.com" />}
              </FormField>

              <FormField
                control={control}
                name="userPassword"
                label="비밀번호 변경"
                description="변경할 때만 새 비밀번호를 입력하세요. 비워두면 기존 비밀번호가 유지됩니다."
              >
                {(field) => (
                  <Input
                    {...field}
                    type="password"
                    autoComplete="new-password"
                    placeholder="새 비밀번호"
                  />
                )}
              </FormField>
            </div>
          </SectionCard>
        </form>
      )}
    </div>
  )
}
