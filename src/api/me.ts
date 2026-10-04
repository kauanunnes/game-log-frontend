import type {
  AccountExport,
  Activity,
  FollowUser,
  GameList,
  GameSummary,
  LibraryEntry,
  LibraryEntryRequest,
  ListForm,
  ListSummary,
  Me,
  Page,
  Profile,
  PublicReview,
  Recommendations,
  Stats,
} from '@/types/api'
import { ApiError, api } from './client'
import { FOLLOWS_PAGE, libraryQuery, type FollowList, type LibraryQuery } from './users'

export type ProfileChanges = Partial<Pick<Me, 'username' | 'displayName' | 'bio' | 'gender'>>
export type SettingsChanges = Partial<
  Pick<Me, 'profileVisibility' | 'showSpending' | 'defaultCurrency'>
>

/** JSON Merge Patch: só os campos enviados mudam, e `null` limpa. */
export const updateMe = (changes: ProfileChanges) =>
  api<Me>('/me', { method: 'PATCH', body: changes })

export const updateMySettings = (changes: SettingsChanges) =>
  api<Me>('/me/settings', { method: 'PATCH', body: changes })

/** Encerra todas as sessões da conta, inclusive esta. */
export const changeMyPassword = (currentPassword: string, newPassword: string) =>
  api<void>('/me/password', { method: 'PUT', body: { currentPassword, newPassword } })

export const deleteMe = (password: string) =>
  api<void>('/me', { method: 'DELETE', body: { password } })

/** Inclui o que é privado, como loja e valor pago (RF10). */
export const exportMyData = () => api<AccountExport>('/me/export')

/** @param page começa em 0 */
export const listMyReviews = (page: number) =>
  api<Page<PublicReview>>(`/me/reviews?page=${page}&size=10`)

/** Quais destas avaliações eu curti. */
export const getMyLikes = (ids: number[]) => api<number[]>(`/me/likes?entryIds=${ids.join(',')}`)

const FEED_PAGE = 20

/** @param page começa em 0 */
export const getMyFeed = (page: number) =>
  api<Page<Activity>>(`/me/feed?page=${page}&size=${FEED_PAGE}`)

export const getMyStats = () => api<Stats>('/me/stats')

/** "Você poderá gostar": calculadas na hora, a partir da biblioteca. */
export const getMyRecommendations = () => api<Recommendations>('/me/recommendations')

/** O mesmo cabeçalho de {@code /users/{username}}, completo mesmo com o perfil privado. */
export const getMyProfile = () => api<Profile>('/me/profile')

/** @param page começa em 0 */
export const listMyFollows = (list: FollowList, page: number) =>
  api<Page<FollowUser>>(`/me/${list}?page=${page}&size=${FOLLOWS_PAGE}`)

export const listMyLibrary = (query: LibraryQuery) =>
  api<Page<LibraryEntry>>(`/me/library?${libraryQuery(query)}`)

/** A entrada do jogo na minha biblioteca, ou {@code null} se ele ainda não está lá. */
export async function getMyEntry(gameId: number): Promise<LibraryEntry | null> {
  try {
    return await api<LibraryEntry>(`/me/library/${gameId}`)
  } catch (error) {
    if (error instanceof ApiError && error.problem.status === 404) return null
    throw error
  }
}

export const saveMyEntry = (gameId: number, body: LibraryEntryRequest) =>
  api<LibraryEntry>(`/me/library/${gameId}`, { method: 'PUT', body })

export const removeMyEntry = (gameId: number) =>
  api<void>(`/me/library/${gameId}`, { method: 'DELETE' })

/** @param page começa em 0 */
export const listMyLists = (page: number) =>
  api<Page<ListSummary>>(`/me/lists?page=${page}&size=24`)

export const createList = (form: ListForm) =>
  api<GameList>('/me/lists', { method: 'POST', body: form })

export const getMyList = (id: number) => api<GameList>(`/me/lists/${id}`)

/** JSON Merge Patch: só o que vier muda. */
export const updateList = (id: number, changes: Partial<ListForm>) =>
  api<GameList>(`/me/lists/${id}`, { method: 'PATCH', body: changes })

/** Troca os itens de uma vez, na ordem do array. */
export const setListItems = (id: number, items: { gameId: number; note: string | null }[]) =>
  api<GameList>(`/me/lists/${id}/items`, { method: 'PUT', body: { items } })

export const deleteList = (id: number) => api<void>(`/me/lists/${id}`, { method: 'DELETE' })

/** Até 5 favoritos em destaque, na ordem do array; lista vazia tira todos. */
export const setFeatured = (gameIds: number[]) =>
  api<GameSummary[]>('/me/library/featured', { method: 'PUT', body: { gameIds } })

/** Manda o link de confirmação de novo (um por minuto). */
export const resendVerification = () => api<void>('/me/email/verification', { method: 'POST' })
