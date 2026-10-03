import type { EntryStatus, LibraryEntry, MyStats, Page } from '@/types/api'
import { api } from './client'

export const getMyStats = () => api<MyStats>('/me/stats')

export const listMyLibrary = (status: EntryStatus, size: number) =>
  api<Page<LibraryEntry>>(`/me/library?status=${status}&size=${size}`)
