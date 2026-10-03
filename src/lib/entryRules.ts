import type { EntryStatus } from '@/types/api'

/** Partes da entrada que dependem do status: a mesma tabela da RN02 que o back-end aplica. */
export type EntryPart =
  'review' | 'playthrough' | 'finishedOn' | 'completed' | 'favorite' | 'acquisition'

const ALLOWED: Record<EntryStatus, EntryPart[]> = {
  WISHLIST: [],
  BACKLOG: ['acquisition'],
  PLAYING: ['review', 'playthrough', 'favorite', 'acquisition'],
  PLAYED: ['review', 'playthrough', 'finishedOn', 'completed', 'favorite', 'acquisition'],
  DROPPED: ['review', 'playthrough', 'finishedOn', 'acquisition'],
}

export const allows = (status: EntryStatus, part: EntryPart) => ALLOWED[status].includes(part)

export const partLabel: Record<EntryPart, string> = {
  review: 'avaliação',
  playthrough: 'plataforma, horas e início',
  finishedOn: 'término',
  completed: '"zerou"',
  favorite: 'favorito',
  acquisition: 'aquisição',
}
