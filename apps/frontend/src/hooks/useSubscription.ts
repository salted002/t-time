import { subscriptionApi } from '@/api/subscriptionApi'
import { useFetch } from '@/hooks/useFetch'

export function useSubscription() {
  return useFetch('subscription', (signal) => subscriptionApi.get(signal))
}
