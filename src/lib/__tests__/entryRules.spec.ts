import { describe, expect, it } from 'vitest'
import type { EntryStatus } from '@/types/api'
import { allows, type EntryPart } from '../entryRules'

/** A tabela da RN02 de 01-requisitos.md (repositório do back-end), célula por célula. */
const TABLE: [EntryPart, Record<EntryStatus, boolean>][] = [
  ['review', { WISHLIST: false, BACKLOG: false, PLAYING: true, PLAYED: true, DROPPED: true }],
  ['playthrough', { WISHLIST: false, BACKLOG: false, PLAYING: true, PLAYED: true, DROPPED: true }],
  ['finishedOn', { WISHLIST: false, BACKLOG: false, PLAYING: false, PLAYED: true, DROPPED: true }],
  ['completed', { WISHLIST: false, BACKLOG: false, PLAYING: false, PLAYED: true, DROPPED: false }],
  ['favorite', { WISHLIST: false, BACKLOG: false, PLAYING: true, PLAYED: true, DROPPED: false }],
  ['acquisition', { WISHLIST: false, BACKLOG: true, PLAYING: true, PLAYED: true, DROPPED: true }],
]

describe('allows', () => {
  it.each(TABLE)('segue a RN02 para %s', (part, row) => {
    for (const [status, allowed] of Object.entries(row)) {
      expect(allows(status as EntryStatus, part), `${part} em ${status}`).toBe(allowed)
    }
  })
})
