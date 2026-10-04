import type {
  GameDetails,
  GameSort,
  GameSummary,
  Genre,
  Page,
  Platform,
  PublicReview,
  Store,
} from '@/types/api'
import { api } from './client'

export interface GameSearch {
  q?: string
  genreId?: number
  platformId?: number
  year?: number
  sort?: GameSort
  /** Começa em 0, como no Spring. */
  page?: number
  size?: number
}

export function searchGames(search: GameSearch, signal?: AbortSignal) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  return api<Page<GameSummary>>(`/games?${params}`, { signal })
}

export const getGame = (slug: string) => api<GameDetails>(`/games/${encodeURIComponent(slug)}`)

export type ReviewSort = 'recent' | 'likes'

/** @param page começa em 0 */
export const listGameReviews = (slug: string, page: number, sort: ReviewSort = 'recent') =>
  api<Page<PublicReview>>(
    `/games/${encodeURIComponent(slug)}/reviews?page=${page}&size=10&sort=${sort}`,
  )

/** As avaliações mais recentes do site todo (só de perfis públicos). */
export const listRecentReviews = (size: number) => api<Page<PublicReview>>(`/reviews?size=${size}`)

export const likeReview = (id: number) => api<void>(`/reviews/${id}/like`, { method: 'PUT' })

export const unlikeReview = (id: number) => api<void>(`/reviews/${id}/like`, { method: 'DELETE' })

export const listGenres = () => api<Genre[]>('/genres')

export const listPlatforms = () => api<Platform[]>('/platforms')

export const listStores = () => api<Store[]>('/stores')
