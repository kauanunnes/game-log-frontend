export interface Tab {
  path: string
  name: string
  label: string
}

export const profileTabs: Tab[] = [
  { path: '', name: 'profile', label: 'Visão geral' },
  { path: 'played', name: 'profile-played', label: 'Jogados' },
  { path: 'playing', name: 'profile-playing', label: 'Jogando' },
  { path: 'backlog', name: 'profile-backlog', label: 'Quero jogar' },
  { path: 'wishlist', name: 'profile-wishlist', label: 'Lista de desejos' },
  { path: 'favorites', name: 'profile-favorites', label: 'Favoritos' },
  { path: 'reviews', name: 'profile-reviews', label: 'Avaliações' },
  { path: 'lists', name: 'profile-lists', label: 'Listas' },
  { path: 'stats', name: 'profile-stats', label: 'Estatísticas' },
]

export const settingsTabs: Tab[] = [
  { path: 'profile', name: 'settings', label: 'Perfil' },
  { path: 'account', name: 'settings-account', label: 'Conta' },
  { path: 'privacy', name: 'settings-privacy', label: 'Privacidade' },
  { path: 'data', name: 'settings-data', label: 'Dados' },
]
