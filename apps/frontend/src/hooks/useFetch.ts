import { useEffect, useState } from 'react'
import axios from 'axios'
import { getErrorMessage } from '@/lib/errors'

interface FetchResult<T> {
  key: string
  data: T | null
  error: string | null
}

/**
 * 공용 조회 훅.
 * - key: 요청에 영향을 주는 값을 모두 담은 문자열. 바뀌면 재요청, null이면 요청하지 않는다.
 * - fetcher: signal을 axios에 전달해야 요청 취소가 동작한다.
 * - latestData: 로딩 중에도 유지되는 마지막 성공 데이터 (전체 건수 깜빡임 방지용).
 */
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
        setResult({ key: requestKey, data: null, error: getErrorMessage(e, '데이터를 불러오지 못했습니다.') })
      })

    return () => controller.abort()

    // fetcher는 의도적으로 제외한다. 요청에 영향을 주는 값은 모두 key에 포함해야 한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  // 로딩 여부는 상태로 두지 않고 "기다리는 요청의 key와 저장된 결과의 key 비교"로 계산한다.
  const loading = requestKey !== null && result?.key !== requestKey

  return {
    data: loading ? null : (result?.data ?? null),
    error: loading ? null : (result?.error ?? null),
    latestData: result?.data ?? null,
    loading,
    refetch: () => setReloadCount((count) => count + 1),
  }
}
