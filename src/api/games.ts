import type { GameSort, GameSummary, Genre, Page, Platform } from '@/types/api'
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

export const listGenres = () => api<Genre[]>('/genres')

export const listPlatforms = () => api<Platform[]>('/platforms')
