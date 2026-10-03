import type { EntryStatus, LibraryEntry, Page, Profile, Stats } from '@/types/api'
import { api } from './client'

/** Filtros de {@code /me/library} e {@code /users/{username}/library}; {@code page} começa em 0. */
export interface LibraryQuery {
  status?: EntryStatus[]
  favorite?: boolean
  completed?: boolean
  reviewed?: boolean
  sort?: string
  page?: number
  size?: number
}

export function libraryQuery({ status, ...rest }: LibraryQuery) {
  const params = new URLSearchParams()
  if (status?.length) params.set('status', status.join(','))
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) params.set(key, String(value))
  }
  return params
}

const user = (username: string) => `/users/${encodeURIComponent(username)}`

export const getProfile = (username: string) => api<Profile>(user(username))

export const listUserLibrary = (username: string, query: LibraryQuery) =>
  api<Page<LibraryEntry>>(`${user(username)}/library?${libraryQuery(query)}`)

export const getUserStats = (username: string) => api<Stats>(`${user(username)}/stats`)
