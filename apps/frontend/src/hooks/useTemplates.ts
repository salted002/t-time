import { templateApi } from '@/api/templateApi'
import { useFetch } from '@/hooks/useFetch'

export function useTemplates() {
  return useFetch('templates', (signal) => templateApi.list(signal))
}
