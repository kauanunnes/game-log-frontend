export type EntryStatus = 'WISHLIST' | 'BACKLOG' | 'PLAYING' | 'PLAYED' | 'DROPPED'
export type Gender = 'FEMALE' | 'MALE' | 'NON_BINARY' | 'OTHER'
export type AcquisitionMethod = 'PURCHASED' | 'GIFT' | 'SUBSCRIPTION' | 'FREE'

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

export interface Me {
  id: number
  username: string
  email: string
  displayName: string | null
  bio: string | null
  gender: Gender | null
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
