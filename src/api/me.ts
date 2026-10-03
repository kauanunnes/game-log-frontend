import type { EntryStatus, LibraryEntry, LibraryEntryRequest, MyStats, Page } from '@/types/api'
import { ApiError, api } from './client'

export const getMyStats = () => api<MyStats>('/me/stats')

export const listMyLibrary = (status: EntryStatus, size: number) =>
  api<Page<LibraryEntry>>(`/me/library?status=${status}&size=${size}`)

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
