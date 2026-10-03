import type { EntryStatus, Gender } from '@/types/api'

export const statusLabel: Record<EntryStatus, string> = {
  WISHLIST: 'Lista de desejos',
  BACKLOG: 'Quero jogar',
  PLAYING: 'Jogando',
  PLAYED: 'Jogado',
  DROPPED: 'Abandonado',
}

export const genderLabel: Record<Gender, string> = {
  FEMALE: 'Feminino',
  MALE: 'Masculino',
  NON_BINARY: 'Não binário',
  OTHER: 'Outro',
}
