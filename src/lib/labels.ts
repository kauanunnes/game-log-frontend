import type {
  AcquisitionMethod,
  EntryStatus,
  GameKind,
  GameSort,
  Gender,
  ReportReason,
} from '@/types/api'

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

export const sortLabel: Record<GameSort, string> = {
  relevance: 'Relevância',
  popular: 'Mais populares',
  trending: 'Em alta na semana',
  rating: 'Mais bem avaliados',
  release: 'Mais recentes',
  title: 'Título (A–Z)',
}

export const kindLabel: Record<GameKind, string> = {
  MAIN: 'Jogo principal',
  EXPANSION: 'Expansão',
  STANDALONE: 'Expansão independente',
  REMAKE: 'Remake',
  REMASTER: 'Remaster',
  EXPANDED: 'Edição expandida',
  PORT: 'Port',
}

export const acquisitionLabel: Record<AcquisitionMethod, string> = {
  PURCHASED: 'Compra',
  GIFT: 'Presente',
  SUBSCRIPTION: 'Assinatura',
  FREE: 'Gratuito',
}

export const reportReasonLabel: Record<ReportReason, string> = {
  SPAM: 'Spam ou propaganda',
  OFFENSIVE: 'Ofensiva ou discriminatória',
  SPOILER: 'Spoiler sem aviso',
  OTHER: 'Outro motivo',
}
