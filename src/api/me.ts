import type { LibraryCounts, LibraryEntry, LibraryEntryRequest, Page, Stats } from '@/types/api'
import { ApiError, api } from './client'
import { libraryQuery, type LibraryQuery } from './users'

export const getMyStats = () => api<Stats>('/me/stats')

export const getMyCounts = () => api<LibraryCounts>('/me/library/counts')

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
