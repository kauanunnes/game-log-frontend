import type {
  EntryStatus,
  FollowUser,
  LibraryEntry,
  Page,
  Profile,
  PublicReview,
  Stats,
} from '@/types/api'
import { ApiError, api } from './client'

export type FollowList = 'followers' | 'following'

export const FOLLOWS_PAGE = 30

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

/** @param page começa em 0 */
export const listUserReviews = (username: string, page: number) =>
  api<Page<PublicReview>>(`${user(username)}/reviews?page=${page}&size=10`)

/** @param page começa em 0 */
export const listUserFollows = (username: string, list: FollowList, page: number) =>
  api<Page<FollowUser>>(`${user(username)}/${list}?page=${page}&size=${FOLLOWS_PAGE}`)

/** A API responde 204 se eu sigo a pessoa e 404 se não. */
export async function isFollowing(username: string) {
  try {
    await api<void>(`${user(username)}/follow`)
    return true
  } catch (error) {
    if (error instanceof ApiError && error.problem.status === 404) return false
    throw error
  }
}

export const follow = (username: string) => api<void>(`${user(username)}/follow`, { method: 'PUT' })

export const unfollow = (username: string) =>
  api<void>(`${user(username)}/follow`, { method: 'DELETE' })
