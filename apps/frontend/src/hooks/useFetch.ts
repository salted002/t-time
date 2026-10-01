import { useEffect, useState } from 'react'
import axios from 'axios'
import { getErrorMessage } from '@/lib/errors'

interface FetchResult<T> {
  key: string
  data: T | null
  error: string | null
}

export function useFetch<T>(key: string | null, fetcher: (signal: AbortSignal) => Promise<T>) {
  const [result, setResult] = useState<FetchResult<T> | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  const requestKey = key === null ? null : `${key}#${reloadCount}`

  useEffect(() => {
    if (requestKey === null) return

    const controller = new AbortController()

    fetcher(controller.signal)
      .then((data) => setResult({ key: requestKey, data, error: null }))
      .catch((e: unknown) => {
        if (axios.isCancel(e)) return
        setResult({
          key: requestKey,
          data: null,
          error: getErrorMessage(e, '데이터를 불러오지 못했습니다.'),
        })
      })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  const loading = requestKey !== null && result?.key !== requestKey

  return {
    data: loading ? null : (result?.data ?? null),
    error: loading ? null : (result?.error ?? null),
    latestData: result?.data ?? null,
    loading,

    refetch: () => setReloadCount((count) => count + 1),
  }
}
