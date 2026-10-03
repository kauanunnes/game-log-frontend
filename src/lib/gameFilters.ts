import type { LocationQuery, LocationQueryRaw, LocationQueryValue } from 'vue-router'
import type { GameSort } from '@/types/api'

/** Filtros da tela Explorar. Moram na URL: ?q=&genre=&platform=&year=&sort=&page= */
export interface GameFilters {
  q?: string
  genreId?: number
  platformId?: number
  year?: number
  sort?: GameSort
  page: number
}

export const MIN_YEAR = 1950
export const MAX_YEAR = 2100
const SORTS: GameSort[] = ['relevance', 'popular', 'rating', 'release', 'title']

type QueryValue = LocationQueryValue | LocationQueryValue[] | undefined

const text = (value: QueryValue) => (Array.isArray(value) ? value[0] : value)?.trim() || undefined

function int(value: QueryValue, min = 1, max = Number.MAX_SAFE_INTEGER) {
  const number = Number(text(value))
  return Number.isInteger(number) && number >= min && number <= max ? number : undefined
}

/** Lê a URL descartando o que for inválido, para nunca mandar à API um filtro que ela recusaria. */
export function parseFilters(query: LocationQuery): GameFilters {
  const sort = text(query.sort) as GameSort | undefined
  return {
    q: text(query.q),
    genreId: int(query.genre),
    platformId: int(query.platform),
    year: int(query.year, MIN_YEAR, MAX_YEAR),
    sort: sort && SORTS.includes(sort) ? sort : undefined,
    page: int(query.page) ?? 1,
  }
}

/** O caminho inverso, sem campos vazios e sem a página 1. */
export function toQuery({
  q,
  genreId,
  platformId,
  year,
  sort,
  page,
}: GameFilters): LocationQueryRaw {
  const query = {
    q,
    genre: genreId,
    platform: platformId,
    year,
    sort,
    page: page > 1 ? page : undefined,
  }
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  )
}

/** Relevância só existe quando há texto; sem texto, a API ordena por popularidade. */
export const sortOptions = (q?: string) => SORTS.filter((sort) => q || sort !== 'relevance')

export function effectiveSort({ q, sort }: Pick<GameFilters, 'q' | 'sort'>): GameSort {
  return sort && sortOptions(q).includes(sort) ? sort : q ? 'relevance' : 'popular'
}
