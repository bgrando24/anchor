import { describe, expect, it } from 'vitest'
import { bandsFrom, bulkBilledPhrase, guidebookCards } from '../app/composables/useGuidebook'
import { rankAreas } from '../app/composables/useScoring'
import type { Lga } from '../app/composables/useLgaData'
import lgaFile from '../app/data/lgas.json'

const areas = (lgaFile as unknown as { lgas: Lga[] }).lgas
const bands = bandsFrom(areas)
const scored = (weeklyIncome = 1000, bedrooms: 1 | 2 | 3 = 2) =>
  rankAreas(areas, {
    weeklyIncome,
    bedrooms,
    weights: { schools: 'somewhat', transport: 'somewhat', gp_access: 'somewhat' }
  })

describe('bulk billing in words', () => {
  it('counts in tens through the normal range', () => {
    expect(bulkBilledPhrase(0.62)).toBe('About 6 in 10 GP visits here are bulk-billed')
    expect(bulkBilledPhrase(0.84)).toBe('About 8 in 10 GP visits here are bulk-billed')
  })

  it('never says ten in ten, which reads as a rounding slip', () => {
    // Hindmarsh and Yarriambiack both sit at 99.3%.
    expect(bulkBilledPhrase(0.993)).toBe('Almost all GP visits here are bulk-billed')
    expect(bulkBilledPhrase(0.96)).toBe('Almost all GP visits here are bulk-billed')
    expect(bulkBilledPhrase(0.999)).toBe('Nearly every GP visit here is bulk-billed')
    for (let i = 0; i <= 1000; i++) {
      expect(bulkBilledPhrase(i / 1000)).not.toContain('10 in 10')
    }
  })
})

describe('the guidebook lines', () => {
  it('describes rather than judges', () => {
    // No line should tell the reader whether what is there is good enough for them.
    const judgments = [/\bfine\b/i, /\bgood\b/i, /\bpoor\b/i, /\bplenty\b/i, /\benough\b/i, /\bbad\b/i, /\bideal\b/i]
    for (const area of scored()) {
      for (const card of guidebookCards(area, { bands, bedrooms: 2 })) {
        for (const pattern of judgments) {
          expect(card.line, `${area.lga_name} ${card.key}: ${card.line}`).not.toMatch(pattern)
        }
      }
    }
  })

  it('gives every area a line for every factor', () => {
    for (const area of scored()) {
      const cards = guidebookCards(area, { bands, bedrooms: 2 })
      expect(cards).toHaveLength(4)
      for (const card of cards) {
        expect(card.line.length, `${area.lga_name} ${card.key}`).toBeGreaterThan(10)
        expect(card.line).not.toContain('undefined')
        expect(card.line).not.toContain('NaN')
        expect(card.line.endsWith('.'), card.line).toBe(true)
      }
    }
  })

  it('says plainly when there is no train station', () => {
    const none = scored().filter((a) => a.station_count === 0)
    expect(none.length).toBeGreaterThan(15)
    for (const area of none) {
      const line = guidebookCards(area, { bands, bedrooms: 2 }).find((c) => c.key === 'transport')!.line
      expect(line).toBe('No train station in this area.')
    }
  })

  it('never writes a plural for one', () => {
    for (const area of scored()) {
      for (const card of guidebookCards(area, { bands, bedrooms: 2 })) {
        expect(card.line, card.line).not.toMatch(/\bOne schools\b|\b1 schools\b|\bOne train stations\b/)
      }
    }
  })

  it('says there is no rent rather than inventing one', () => {
    const noRent = scored(1000, 1).filter((a) => a.rentPerWeek == null)
    expect(noRent.length).toBeGreaterThan(0)
    for (const area of noRent) {
      const line = guidebookCards(area, { bands, bedrooms: 1 }).find((c) => c.key === 'rent')!.line
      expect(line).toBe('No typical rent is published for 1-bedroom homes here.')
    }
  })

  it('counts only the kinds of school the household asked about', () => {
    const casey = scored().find((a) => a.lga_name === 'Casey')!
    const line = guidebookCards(casey, {
      bands,
      bedrooms: 2,
      schoolFilter: { levels: ['primary'], sectors: ['catholic'] }
    }).find((c) => c.key === 'schools')!.line
    expect(line).toContain(String(casey.schools.primary.catholic))
    expect(line).toContain('of the kinds you asked about')
  })

  it('quotes the same figure the card is scored on', () => {
    // The line is built from the raw value, so it can never contradict the bar beside it.
    for (const area of scored()) {
      const cards = guidebookCards(area, { bands, bedrooms: 2 })
      expect(cards.find((c) => c.key === 'schools')!.line).toContain(String(area.school_count))
      if (area.station_count > 1) {
        expect(cards.find((c) => c.key === 'transport')!.line).toContain(String(area.station_count))
      }
    }
  })

  it('places every area somewhere in the distribution', () => {
    const phrases = ['more than most areas', 'fewer than most areas', 'about the middle for Victoria']
    let seen = new Set<string>()
    for (const area of scored()) {
      const line = guidebookCards(area, { bands, bedrooms: 2 }).find((c) => c.key === 'schools')!.line
      for (const p of phrases) if (line.includes(p)) seen.add(p)
    }
    // All three bands should actually occur across 79 areas, or the bands are wrong.
    expect([...seen].sort()).toEqual([...phrases].sort())
  })
})

describe('the rent line tells apart "no rent" from "no income"', () => {
  it('says there is no rent only when none is published', () => {
    const area = { rentPerWeek: null, rentSharePct: null, ranks: {}, schools: {}, station_count: 0, bulk_billing_rate: 0.9, school_count: 0 } as never
    expect(guidebookCards(area, { bands, bedrooms: 2 })[0]!.line).toBe(
      'No typical rent is published for 2-bedroom homes here.'
    )
  })

  it('quotes the rent without a share when the income is not known yet', () => {
    // A ranked area with a published rent must not be described as having none.
    const area = { rentPerWeek: 480, rentSharePct: null, ranks: {}, schools: {}, station_count: 0, bulk_billing_rate: 0.9, school_count: 0 } as never
    expect(guidebookCards(area, { bands, bedrooms: 2 })[0]!.line).toBe('$480 a week for a 2-bedroom home.')
  })

  it('never claims there is no rent for an area that is ranked on one', () => {
    for (const area of scored()) {
      const line = guidebookCards(area, { bands, bedrooms: 2 })[0]!.line
      if (area.rentPerWeek != null) {
        expect(line, `${area.lga_name}: ${line}`).not.toContain('No typical rent')
        expect(line).toContain(`$${area.rentPerWeek}`)
      }
    }
  })
})
