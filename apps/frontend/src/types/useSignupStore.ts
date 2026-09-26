import { useState } from 'react'
import type { AcademyInfoFormValues } from '@/types/academy'

/**
 * 회원가입 (학원 정보 → 계정 정보) 단계 간에 공유되는 상태.
 * `/signup` 라우트는 쿼리스트링(step)만 바뀌므로 이 훅을 호출하는 SignupPage는
 * 리마운트되지 않는다 — 그 결과로 얻은 값을 하위 스텝 컴포넌트에 props로 전달한다.
 */
export function useSignupState() {
  const [academyInfo, setAcademyInfo] = useState<AcademyInfoFormValues | null>(null)

  return {
    academyInfo,
    setAcademyInfo,
    reset: () => setAcademyInfo(null),
  }
}
