export type EntryStatus = 'WISHLIST' | 'BACKLOG' | 'PLAYING' | 'PLAYED' | 'DROPPED'
export type Gender = 'FEMALE' | 'MALE' | 'NON_BINARY' | 'OTHER'
export type AcquisitionMethod = 'PURCHASED' | 'GIFT' | 'SUBSCRIPTION' | 'FREE'
export type GameSort = 'relevance' | 'popular' | 'rating' | 'release' | 'title'
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

/** Só o que as telas usam de {@code GET /me/stats}. */
export interface MyStats {
  total: number
  byStatus: Record<EntryStatus, number>
  hoursPlayed: number
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
