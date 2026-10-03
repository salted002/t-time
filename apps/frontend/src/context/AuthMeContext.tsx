import { createContext } from 'react'
import type { ReactNode } from 'react'
import { api } from '@/lib/api'
import { useFetch } from '@/hooks/useFetch'
import type { AuthMe } from '@/types/authMe'

export interface AuthMeContextValue {
  me: AuthMe | null
  loading: boolean
  refetch: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthMeContext = createContext<AuthMeContextValue | null>(null)

export function AuthMeProvider({ children }: { children: ReactNode }) {
  const { latestData, loading, refetch } = useFetch<AuthMe>('auth-me', (signal) =>
    api.get<AuthMe>('/auth/me', { signal }).then((response) => response.data),
  )

  // 다시 불러오는 동안에도 이전 값을 유지해서 화면이 깜빡이지 않게 latestData를 쓴다.
  return (
    <AuthMeContext.Provider value={{ me: latestData, loading, refetch }}>
      {children}
    </AuthMeContext.Provider>
  )
}
