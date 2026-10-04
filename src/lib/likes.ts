import { computed, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getMyLikes } from '@/api/me'
import { useAuthStore } from '@/stores/auth'
import type { PublicReview } from '@/types/api'

/**
 * Quais destas avaliações eu curti. As listas respondem igual para todo mundo, então isso vem à parte, numa
 * chamada só para a página inteira.
 */
export function useLikedReviews(reviews: Ref<PublicReview[] | undefined>) {
  const auth = useAuthStore()
  const ids = computed(() => reviews.value?.map((review) => review.id) ?? [])
  const { data } = useQuery({
    queryKey: ['me', computed(() => auth.user?.id), 'likes', ids],
    queryFn: () => getMyLikes(ids.value),
    enabled: computed(() => auth.isLoggedIn && ids.value.length > 0),
  })
  return computed(() => new Set(data.value ?? []))
}
