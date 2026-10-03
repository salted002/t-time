import { api } from '@/lib/api'
import type { PlanId, SubscriptionResponse } from '@/types/subscription'

export const subscriptionApi = {
  // GET /subscription (API 53)
  get: (signal: AbortSignal) =>
    api.get<SubscriptionResponse>('/subscription', { signal }).then((response) => response.data),

  // POST /subscription (API 54)
  subscribe: (planId: PlanId): Promise<void> =>
    api.post('/subscription', { planId }).then(() => undefined),

  // DELETE /subscription (API 55)
  cancel: (): Promise<void> => api.delete('/subscription').then(() => undefined),
}
