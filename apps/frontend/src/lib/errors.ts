import axios from 'axios'

// 서버 에러 메시지(response.data.message)를 꺼내고, 없으면 fallback을 반환한다.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message
    return message ?? fallback
  }
  return fallback
}
