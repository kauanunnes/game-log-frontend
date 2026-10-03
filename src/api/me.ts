import type { LibraryCounts, LibraryEntry, LibraryEntryRequest, Me, Page, Stats } from '@/types/api'
import { ApiError, api } from './client'
import { libraryQuery, type LibraryQuery } from './users'

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
