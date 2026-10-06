import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/templates/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, getToken, setToken } from '@/lib/api'
import { passwordChangeSchema } from '@/types/password'
import type { PasswordChangeFormValues } from '@/types/password'
import { PAGE_TEXT } from '@/lib/pageText'

const FORM_ID = 'password-change-form'

export default function PasswordChangePage() {
  const { slug } = useParams()
  const [saving, setSaving] = useState(false)

  const { control, handleSubmit, setError, reset } = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', newPassword: '', newPasswordConfirm: '' },
  })

  const onSubmit = handleSubmit(async (data) => {
    // 현재 비밀번호가 틀리면 서버가 401을 주고, api 인터셉터가 토큰을 지우므로 미리 보관해 둔다
    const token = getToken()
    const persist = Boolean(localStorage.getItem('ttime_token'))

    setSaving(true)
    try {
      await api.patch('/auth/password', data)
      toast.success('비밀번호가 변경되었습니다.')
      reset()
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined
      if (status === 401) {
        if (token) setToken(token, persist)
        setError('currentPassword', { message: '현재 비밀번호가 일치하지 않습니다.' })
      } else if (status === 400 && isAxiosError(error)) {
        toast.error(error.response?.data?.message ?? '입력한 내용을 확인해주세요.')
      } else {
        toast.error('비밀번호 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setSaving(false)
    }
  })

  return (
    <div>
      <PageHeader
        title="비밀번호 변경"
        {...PAGE_TEXT.PASSWORD_CHANGE}
        back={{ label: '학원 설정', to: `/${slug}/settings` }}
      />

      <SectionCard>
        <form id={FORM_ID} onSubmit={onSubmit} noValidate className="max-w-xl space-y-5">
          <FormField control={control} name="currentPassword" label="현재 비밀번호" required>
            {(field) => <Input {...field} type="password" autoComplete="current-password" />}
          </FormField>

          <FormField
            control={control}
            name="newPassword"
            label="새 비밀번호"
            required
            description="8자 이상 입력해주세요."
          >
            {(field) => <Input {...field} type="password" autoComplete="new-password" />}
          </FormField>

          <FormField control={control} name="newPasswordConfirm" label="새 비밀번호 확인" required>
            {(field) => <Input {...field} type="password" autoComplete="new-password" />}
          </FormField>

          <div className="flex justify-end pt-3">
            <Button type="submit" disabled={saving}>
              {saving ? '변경 중...' : '변경하기'}
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}
