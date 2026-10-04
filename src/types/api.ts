export type EntryStatus = 'WISHLIST' | 'BACKLOG' | 'PLAYING' | 'PLAYED' | 'DROPPED'
export type Gender = 'FEMALE' | 'MALE' | 'NON_BINARY' | 'OTHER'
export type AcquisitionMethod = 'PURCHASED' | 'GIFT' | 'SUBSCRIPTION' | 'FREE'
export type GameSort = 'relevance' | 'popular' | 'trending' | 'rating' | 'release' | 'title'
export type GameKind =
  'MAIN' | 'EXPANSION' | 'STANDALONE' | 'REMAKE' | 'REMASTER' | 'EXPANDED' | 'PORT'

export interface Money {
  amount: string
  currency: string
}

export interface GameSummary {
  id: number
  slug: string
  title: string
  coverUrl: string | null
  releaseYear: number | null
}

export interface Genre {
  id: number
  name: string
  slug: string
}

export interface Platform {
  id: number
  name: string
  abbreviation: string | null
  slug: string
}

export interface GameDetails {
  id: number
  slug: string
  title: string
  summary: string | null
  releaseDate: string | null
  kind: GameKind
  coverUrl: string | null
  genres: Genre[]
  platforms: Platform[]
  developers: string[]
  publishers: string[]
  franchises: string[]
  themes: string[]
  modes: string[]
  perspectives: string[]
  /** De 0 a 100, arredondada. */
  igdbRating: number | null
  igdbRatingCount: number | null
  community: Community
}

/** Só perfis públicos (RN11). */
export interface Community {
  averageRating: number | null
  ratingsCount: number
  /** Uma faixa a cada meia estrela, de 0 a 5. */
  ratingDistribution: { stars: number; count: number }[]
  recommendPercent: number | null
  playersCount: number
  wantToPlayCount: number
}

export interface PublicReview {
  user: { username: string; displayName: string | null }
  game: GameSummary
  status: EntryStatus
  rating: number | null
  recommends: boolean | null
  text: string
  hasSpoilers: boolean
  reviewedAt: string
}

export interface Review {
  rating: number | null
  recommends: boolean | null
  text: string | null
  hasSpoilers: boolean
}

export interface Playthrough {
  platformId: number | null
  hoursPlayed: number | null
  startedOn: string | null
  finishedOn: string | null
  completed: boolean | null
}

export interface Acquisition {
  method: AcquisitionMethod
  storeId: number | null
  price: Money | null
  acquiredOn: string | null
}

/** Corpo do {@code PUT /me/library/{gameId}}. */
export interface LibraryEntryRequest {
  status: EntryStatus
  favorite: boolean
  review: Review | null
  playthrough: Playthrough | null
  acquisition: Acquisition | null
}

export interface Store {
  id: number
  name: string
  slug: string
}

export interface LibraryEntry {
  game: GameSummary
  status: EntryStatus
  favorite: boolean
  review: Review | null
  playthrough: Playthrough | null
  acquisition: Acquisition | null
  createdAt: string
  updatedAt: string
}

export type ProfileVisibility = 'PUBLIC' | 'PRIVATE'

export interface Me {
  id: number
  username: string
  email: string
  displayName: string | null
  bio: string | null
  gender: Gender | null
  role?: 'USER' | 'ADMIN'
  profileVisibility?: ProfileVisibility
  showSpending?: boolean
  defaultCurrency?: string
  createdAt?: string
}

export interface NamedCount {
  id: number
  name: string
  count: number
}

/** Por moeda, sem conversão; os valores vêm como string. */
export interface Spending {
  currency: string
  total: string
  purchases: number
  byStore: { storeId: number | null; name: string | null; total: string }[]
  byYear: { year: number; total: string }[]
}

/** {@code GET /me/stats} e {@code GET /users/{username}/stats}; {@code spending} só vem se for visível. */
export interface Stats {
  year?: number
  total: number
  byStatus: Record<EntryStatus, number>
  finishedByYear: { year: number; count: number }[]
  byGenre: NamedCount[]
  byPlatform: NamedCount[]
  ratingDistribution: { stars: number; count: number }[]
  averageRating?: number
  hoursPlayed: number
  spending?: Spending[]
}

export interface LibraryCounts {
  played: number
  playing: number
  backlog: number
  wishlist: number
  dropped: number
  favorites: number
  reviews: number
}

/** Contadores do cabeçalho: as abas da biblioteca, seguidores e seguidos. */
export interface ProfileCounts extends LibraryCounts {
  followers: number
  following: number
}

/** Num perfil privado, só username, displayName e {@code private}. */
export interface Profile {
  username: string
  displayName: string | null
  private: boolean
  bio?: string
  gender?: Gender
  memberSince?: string
  counts?: ProfileCounts
}

/** Uma pessoa da lista de seguidores ou de seguidos. */
export interface FollowUser {
  username: string
  displayName: string | null
  followedAt: string
}

export interface TokenResponse {
  accessToken: string
  expiresIn: number
}

export interface Page<T> {
  content: T[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}

export interface ProblemDetail {
  type: string
  title: string
  status: number
  detail?: string
  code?: string
  errors?: { field: string; message: string }[]
}
