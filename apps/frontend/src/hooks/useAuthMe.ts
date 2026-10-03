import { useContext } from 'react'
import { AuthMeContext } from '@/context/AuthMeContext'

// AcademyProfileDropdown 등 기존 import가 깨지지 않게 타입을 다시 내보낸다.
export type { AuthMe } from '@/types/authMe'

export function useAuthMe() {
  const ctx = useContext(AuthMeContext)
  if (!ctx) {
    throw new Error('useAuthMe는 AuthMeProvider 안에서만 쓸 수 있습니다')
  }
  return ctx
}
