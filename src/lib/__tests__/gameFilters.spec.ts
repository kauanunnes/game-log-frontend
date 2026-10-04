import { describe, expect, it } from 'vitest'
import { effectiveSort, parseFilters, toQuery } from '../gameFilters'

describe('parseFilters', () => {
  it('lê os filtros da URL', () => {
    expect(
      parseFilters({
        q: ' zelda ',
        genre: '2',
        platform: '8',
        year: '2017',
        sort: 'rating',
        page: '3',
      }),
    ).toEqual({ q: 'zelda', genreId: 2, platformId: 8, year: 2017, sort: 'rating', page: 3 })
  })

  it('descarta o que a API recusaria', () => {
    expect(
      parseFilters({ q: '  ', genre: 'abc', year: '1800', sort: 'constructor', page: '0' }),
    ).toEqual({ page: 1 })
  })
})

describe('toQuery', () => {
  it('omite campos vazios e a página 1', () => {
    expect(toQuery({ q: 'zelda', year: 2017, sort: 'rating', page: 2 })).toEqual({
      q: 'zelda',
      year: 2017,
      sort: 'rating',
      page: 2,
    })
    expect(toQuery({ q: '', page: 1 })).toEqual({})
  })
})

describe('effectiveSort', () => {
  it('usa relevância só quando há texto', () => {
    expect(effectiveSort({ q: 'zelda' })).toBe('relevance')
    expect(effectiveSort({})).toBe('popular')
    expect(effectiveSort({ sort: 'relevance' })).toBe('popular')
    expect(effectiveSort({ q: 'zelda', sort: 'title' })).toBe('title')
    expect(effectiveSort({ sort: 'trending' })).toBe('trending')
  })
})
