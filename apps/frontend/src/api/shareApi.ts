import axios from 'axios'
import { api } from '@/lib/api'
import type { SharedReport, SharedReportResult } from '@/types/share'

export const shareApi = {
  // GET /share/:token (API 37) — 404: 유효하지 않은 링크, 410: 만료
  get: async (token: string, signal: AbortSignal): Promise<SharedReportResult> => {
    try {
      const response = await api.get<SharedReport>(`/share/${encodeURIComponent(token)}`, {
        signal,
      })
      return { ok: true, report: response.data }
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 404) return { ok: false, reason: 'invalid' }
        if (e.response?.status === 410) return { ok: false, reason: 'expired' }
      }
      throw e
    }
  },
}
