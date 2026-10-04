import { describe, expect, it } from 'vitest'
import { formatRelative } from '../format'

describe('formatRelative', () => {
  const now = Date.parse('2026-10-04T12:00:00Z')

  it('usa a maior unidade que cabe', () => {
    expect(formatRelative('2026-10-04T11:59:30Z', now)).toBe('agora')
    expect(formatRelative('2026-10-04T11:55:00Z', now)).toBe('há 5 minutos')
    expect(formatRelative('2026-10-04T10:00:00Z', now)).toBe('há 2 horas')
    expect(formatRelative('2026-10-03T12:00:00Z', now)).toBe('ontem')
    expect(formatRelative('2026-09-13T12:00:00Z', now)).toBe('há 3 semanas')
  })
})
