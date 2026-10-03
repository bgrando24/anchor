import { describe, expect, it } from 'vitest'
import { comparisonRows } from '../app/composables/useComparison'
import { ordinal, rankAreas } from '../app/composables/useScoring'
import type { Lga } from '../app/composables/useLgaData'
import lgaFile from '../app/data/lgas.json'

const areas = (lgaFile as unknown as { lgas: Lga[] }).lgas
const scored = (weeklyIncome = 1000, bedrooms: 1 | 2 | 3 = 2) =>
  rankAreas(areas, {
    weeklyIncome,
    bedrooms,
    weights: { schools: 'somewhat', transport: 'somewhat', gp_access: 'somewhat' }
  })

describe('comparing an area with where you live now', () => {
  it('gives a row per measure, every one with a sentence and both figures', () => {
    const list = scored()
    for (const area of list.slice(0, 20)) {
      const rows = comparisonRows(area, list[40]!, 2)
      expect(rows).toHaveLength(7)
      for (const row of rows) {
        expect(row.headline.length, `${area.lga_name} ${row.key}`).toBeGreaterThan(3)
        expect(row.detail).not.toContain('undefined')
        expect(row.detail).not.toContain('NaN')
        expect(['up', 'down', 'same', 'unknown']).toContain(row.direction)
      }
    }
  })

  it('says cheaper or dearer, not just a number', () => {
    const list = scored()
    const a = list.find((x) => x.rentPerWeek === 400)
    const b = list.find((x) => x.rentPerWeek === 500)
    if (a && b) {
      expect(comparisonRows(a, b, 2).find((r) => r.key === 'rent')!.headline).toBe('$100 a week cheaper')
      expect(comparisonRows(b, a, 2).find((r) => r.key === 'rent')!.headline).toBe('$100 a week dearer')
    }
  })

  it('reports a tie as a tie rather than a zero difference', () => {
    const list = scored()
    const area = list[10]!
    const rows = comparisonRows(area, area, 2)
    for (const row of rows) {
      expect(row.direction, row.key).toBe('same')
    }
  })

  // "Same as Port Phillip" named the other area but never what was the same, so a row reading
  // "2 here, 2 in Port Phillip" had no subject anywhere on it.
  it('says what is the same, not just who it is the same as', () => {
    const list = scored()
    const area = list[10]!
    const expected: Record<string, string> = {
      rank: 'Ranked the same for you',
      rent: 'The same rent',
      share: 'The same share of your income',
      schools: 'The same number of schools',
      stations: 'The same number of train stations',
      gp: 'GP visits bulk-billed as often',
      // Comparing an area with itself is the one case where the distance is nothing.
      distance: 'The same place'
    }
    for (const row of comparisonRows(area, area, 2)) {
      expect(row.headline, row.key).toBe(expected[row.key])
      expect(row.headline, `${row.key} names the other area instead of the measure`).not.toContain(area.lga_name)
    }
  })

  it('refuses a direction when either side has no figure', () => {
    // One-bedroom rents are unpublished in about half the state.
    const list = scored(1000, 1)
    const withRent = list.find((a) => a.rentPerWeek != null)!
    const without = list.find((a) => a.rentPerWeek == null)!
    const row = comparisonRows(withRent, without, 1).find((r) => r.key === 'rent')!
    expect(row.headline).toBe('No data for one of them')
    expect(row.direction).toBe('unknown')
  })

  it('never writes a plural for a difference of one', () => {
    const list = scored()
    for (const area of list) {
      for (const other of list.slice(0, 12)) {
        for (const row of comparisonRows(area, other, 2)) {
          expect(row.headline, row.headline).not.toMatch(/\b1 (schools|train stations|points)\b/)
        }
      }
    }
  })

  it('calls the better-fitting area higher, matching the rank order', () => {
    const list = scored()
    const better = list[5]!
    const worse = list[60]!
    expect(comparisonRows(better, worse, 2).find((r) => r.key === 'rank')!.headline).toBe('Ranked higher for you')
    expect(comparisonRows(worse, better, 2).find((r) => r.key === 'rank')!.headline).toBe('Ranked lower for you')
  })

  it('writes the same ordinals the rest of the app uses', () => {
    const list = scored()
    const row = comparisonRows(list[2]!, list[7]!, 2).find((r) => r.key === 'rank')!
    expect(row.detail).toBe(`${ordinal(list[2]!.rank)} here, ${ordinal(list[7]!.rank)} for ${list[7]!.lga_name}`)
  })

  it('holds up for every pairing a user could reach', () => {
    for (const bedrooms of [1, 2, 3] as const) {
      const list = scored(700, bedrooms)
      const current = list[Math.floor(list.length / 2)]!
      for (const area of list) {
        for (const row of comparisonRows(area, current, bedrooms)) {
          expect(row.headline, `${area.lga_name} ${row.key}`).not.toContain('undefined')
          expect(row.headline).not.toContain('NaN')
          expect(row.headline).not.toMatch(/^\$-|-\d+ point/)
        }
      }
    }
  })
})

describe('how far away the area is', () => {
  it('says the distance from where they live now', () => {
    const list = scored()
    const here = list.find((a) => a.lga_name === 'Port Phillip')!
    const there = list.find((a) => a.lga_name === 'Mildura')!
    const row = comparisonRows(there, here, 2).find((r) => r.key === 'distance')!
    expect(row.headline).toMatch(/^\d+ km from Port Phillip$/)
    // Centres of whole councils, so the line under it has to say that and not imply a drive.
    expect(row.detail).toBe('Measured between the centres of the two areas')
  })

  it('never claims a direction for a distance', () => {
    const list = scored()
    for (const area of list.slice(0, 5)) {
      const row = comparisonRows(area, list[0]!, 2).find((r) => r.key === 'distance')!
      expect(row.direction).toBe('same')
    }
  })
})
