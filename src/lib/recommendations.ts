import { computed, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getMyRecommendations } from '@/api/me'
import { useAuthStore } from '@/stores/auth'

/** Enquanto o modelo escolhe em segundo plano, a API manda perguntar de novo. */
const CURATING_POLL_MS = 3000

/**
 * "Você poderá gostar", a mesma consulta no Início e em Para você. Mexer na biblioteca invalida tudo em
 * ['me'], e as sugestões são recalculadas.
 */
export function useRecommendations(enabled?: Ref<boolean>) {
  const auth = useAuthStore()
  return useQuery({
    queryKey: ['me', computed(() => auth.user?.id), 'recommendations'],
    queryFn: getMyRecommendations,
    enabled,
    refetchInterval: (query) => (query.state.data?.curating ? CURATING_POLL_MS : false),
  })
}
