import { computed, type Ref } from 'vue'
import { getMyProfile, getMyStats, listMyFollows, listMyLibrary, listMyReviews } from '@/api/me'
import {
  getProfile,
  getUserStats,
  listUserFollows,
  listUserLibrary,
  listUserReviews,
  type FollowList,
  type LibraryQuery,
} from '@/api/users'
import { useAuthStore } from '@/stores/auth'

/**
 * De onde vêm os dados de um perfil. O dono usa {@code /me}: inclui loja e valor pago e vale mesmo com o perfil
 * privado. As outras pessoas usam as rotas públicas, que respondem igual para todo mundo.
 */
export function useProfileSource(username: Ref<string>) {
  const auth = useAuthStore()
  const isOwner = computed(() => auth.user?.username === username.value)
  return {
    isOwner,
    header: () => (isOwner.value ? getMyProfile() : getProfile(username.value)),
    follows: (list: FollowList, page: number) =>
      isOwner.value ? listMyFollows(list, page) : listUserFollows(username.value, list, page),
    library: (query: LibraryQuery) =>
      isOwner.value ? listMyLibrary(query) : listUserLibrary(username.value, query),
    stats: () => (isOwner.value ? getMyStats() : getUserStats(username.value)),
    reviews: (page: number) =>
      isOwner.value ? listMyReviews(page) : listUserReviews(username.value, page),
  }
}
