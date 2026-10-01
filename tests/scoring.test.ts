import { describe, expect, it } from 'vitest'
// Vectors and the legacy fixture are vendored under tests/fixtures so the suite is
// self-contained and does not read anything from outside the repo.
import vectors from './fixtures/scoring-test-vectors.json'
import lgaFile from '../app/data/lgas.json'
import {
  bandFor,
  percentileRank,
  prioritySplit,
  rankAreas,
  schoolsMatching,
  typicalRent,
  type Bedrooms,
  type PriorityWeights
} from '../app/composables/useScoring'
import type { Lga } from '../app/composables/useLgaData'

const areas = (lgaFile as unknown as { lgas: Lga[] }).lgas

function weightsFromCode(code: string): PriorityWeights {
  const map = { n: 'not_much', s: 'somewhat', a: 'a_lot' } as const
  const [s, t, g] = code.split('') as ('n' | 's' | 'a')[]
  return { schools: map[s!], transport: map[t!], gp_access: map[g!] }
}

describe('reference test vectors', () => {
  for (const c of vectors.cases) {
    it(`$${c.weekly_income}/wk, ${c.bedrooms} bed, weights ${c.weights}`, () => {
      const ranked = rankAreas(areas, {
        weeklyIncome: c.weekly_income,
        bedrooms: c.bedrooms as Bedrooms,
        weights: weightsFromCode(c.weights)
      })
      const top10 = ranked.slice(0, 10)
      expect(top10.map((r) => r.lga_code)).toEqual(c.top10_codes)
      expect(top10.map((r) => r.band)).toEqual(c.bands)
      expect(top10.map((r) => r.rentSharePct)).toEqual(c.rent_share_pct)
      expect(top10.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    })
  }
})

describe('prioritySplit', () => {
  const codes: string[] = []
  for (const a of 'nsa') for (const b of 'nsa') for (const c of 'nsa') codes.push(a + b + c)

  it('always sums to 50', () => {
    for (const code of codes) {
      const split = prioritySplit(code)
      expect(split.reduce((x, y) => x + y, 0), code).toBe(50)
      expect(split.every((v) => Number.isInteger(v) && v >= 0), code).toBe(true)
    }
  })

  it('matches the named cases', () => {
    expect(prioritySplit('sss')).toEqual([17, 17, 16])
    expect(prioritySplit('ann')).toEqual([38, 6, 6])
    expect(prioritySplit('asa')).toEqual([20, 10, 20])
  })

  it('orders points by tier', () => {
    expect(prioritySplit('nsa')).toEqual([5, 15, 30])
    expect(prioritySplit('nnn')).toEqual([17, 17, 16])
  })
})

describe('bands', () => {
  it('uses the rounded percent for its boundaries', () => {
    expect(bandFor(30)).toBe('within')
    expect(bandFor(31)).toBe('stretch')
    expect(bandFor(40)).toBe('stretch')
    expect(bandFor(41)).toBe('hard')
    expect(bandFor(50)).toBe('hard')
    expect(bandFor(51)).toBe('out')
    expect(bandFor(null)).toBe('nodata')
  })

  it('rounds 30.5 up to 31, so the number on screen matches its heading', () => {
    // rent 305 on income 1000 is exactly 30.5%
    const [area] = rankAreas(
      [{ ...areas[0]!, rent: { flat_1br: null, flat_2br: 305, house_2br: null, house_3br: null } }],
      { weeklyIncome: 1000, bedrooms: 2, weights: { schools: 'somewhat', transport: 'somewhat', gp_access: 'somewhat' } }
    )
    expect(area!.rentSharePct).toBe(31)
    expect(area!.band).toBe('stretch')
  })

  it('rounds 30.4 down to 30 and stays within', () => {
    const [area] = rankAreas(
      [{ ...areas[0]!, rent: { flat_1br: null, flat_2br: 304, house_2br: null, house_3br: null } }],
      { weeklyIncome: 1000, bedrooms: 2, weights: { schools: 'somewhat', transport: 'somewhat', gp_access: 'somewhat' } }
    )
    expect(area!.rentSharePct).toBe(30)
    expect(area!.band).toBe('within')
  })
})

describe('typicalRent', () => {
  const rent = { flat_1br: 300, flat_2br: 280, house_2br: 400, house_3br: 350 }

  it('takes the cheapest dwelling with at least the bedrooms needed', () => {
    expect(typicalRent(rent, 1)).toBe(280)
    expect(typicalRent(rent, 2)).toBe(280)
    expect(typicalRent(rent, 3)).toBe(350)
  })

  it('returns null when nothing big enough was published', () => {
    expect(typicalRent({ flat_1br: 300, flat_2br: null, house_2br: null, house_3br: null }, 2)).toBeNull()
    expect(typicalRent({ flat_1br: null, flat_2br: null, house_2br: null, house_3br: null }, 1)).toBeNull()
  })
})

describe('percentileRank', () => {
  it('spreads 0 to 10 and averages ties', () => {
    expect(percentileRank([1, 2, 3])).toEqual([0, 5, 10])
    expect(percentileRank([1, 1, 3])).toEqual([2.5, 2.5, 10])
    expect(percentileRank([5, 5])).toEqual([5, 5])
  })
})

describe('areas with no rent data', () => {
  const weights: PriorityWeights = { schools: 'somewhat', transport: 'somewhat', gp_access: 'somewhat' }

  it('are banded nodata and listed last', () => {
    const ranked = rankAreas(areas, { weeklyIncome: 1000, bedrooms: 3, weights })
    const nodata = ranked.filter((r) => r.band === 'nodata')
    expect(nodata.length).toBeGreaterThan(0)
    expect(ranked.slice(-nodata.length).every((r) => r.band === 'nodata')).toBe(true)
    expect(nodata.every((r) => r.rentSharePct === null && r.rentPerWeek === null)).toBe(true)
  })

  it('ranks every area exactly once', () => {
    const ranked = rankAreas(areas, { weeklyIncome: 850, bedrooms: 1, weights })
    expect(ranked).toHaveLength(79)
    expect(new Set(ranked.map((r) => r.rank)).size).toBe(79)
  })
})

describe('schools count only when they apply', () => {
  const base = { weeklyIncome: 1000, bedrooms: 2 as const }

  it('hands the whole fifty points to transport and doctors when schools do not apply', () => {
    const off = rankAreas(areas, {
      ...base,
      weights: { schools: 'none', transport: 'somewhat', gp_access: 'somewhat' }
    })
    expect(off[0]!.split.schools).toBe(0)
    expect(off[0]!.split.transport + off[0]!.split.gp_access).toBe(50)
    expect(off[0]!.split.rent).toBe(50)
  })

  it('splits the fifty in proportion when one of the other two matters more', () => {
    const scored = rankAreas(areas, {
      ...base,
      weights: { schools: 'none', transport: 'a_lot', gp_access: 'not_much' }
    })
    const { schools, transport, gp_access } = scored[0]!.split
    expect(schools).toBe(0)
    expect(transport).toBeGreaterThan(gp_access)
    expect(transport + gp_access).toBe(50)
  })

  it('ranks the same whatever schools tier is stored, once schools do not apply', () => {
    const order = (tier: 'not_much' | 'a_lot') =>
      rankAreas(areas, { ...base, weights: { schools: 'none', transport: 'somewhat', gp_access: 'somewhat' } }).map(
        (a) => a.lga_code
      )
    expect(order('a_lot')).toEqual(order('not_much'))
  })

  it('never divides by zero, even for a hand-edited link with nothing weighted', () => {
    const scored = rankAreas(areas, {
      ...base,
      weights: { schools: 'none', transport: 'not_much', gp_access: 'not_much' }
    })
    for (const area of scored) {
      expect(Number.isFinite(area.score), area.lga_name).toBe(true)
    }
  })
})

describe('ranking on the kinds of school a household wants', () => {
  const base = {
    weeklyIncome: 1000,
    bedrooms: 2 as const,
    weights: { schools: 'a_lot', transport: 'not_much', gp_access: 'not_much' } as const
  }

  it('counts every school when no kinds are given', () => {
    for (const area of areas.slice(0, 20)) {
      expect(schoolsMatching(area)).toBe(area.school_count)
    }
  })

  it('counts only the chosen level and sector', () => {
    const area = areas.find((a) => a.lga_name === 'Casey')!
    expect(schoolsMatching(area, { levels: ['primary'], sectors: ['government'] })).toBe(
      area.schools.primary.government
    )
    expect(schoolsMatching(area, { levels: ['primary'], sectors: ['government', 'catholic'] })).toBe(
      area.schools.primary.government + area.schools.primary.catholic
    )
  })

  it('counts a school that teaches both levels in each of them', () => {
    // The source counts combined schools on both sides, so both levels can exceed the total.
    const area = areas.find((a) => a.lga_name === 'Alpine')!
    const both = schoolsMatching(area, {
      levels: ['primary', 'secondary'],
      sectors: ['government', 'catholic', 'independent']
    })
    expect(both).toBeGreaterThan(area.school_count)
  })

  it('changes the ranking when the household wants a different kind of school', () => {
    const government = rankAreas(areas, {
      ...base,
      schoolFilter: { levels: ['primary'], sectors: ['government'] }
    })
    const independent = rankAreas(areas, {
      ...base,
      schoolFilter: { levels: ['secondary'], sectors: ['independent'] }
    })
    expect(government.map((a) => a.lga_code)).not.toEqual(independent.map((a) => a.lga_code))
  })

  it('leaves the ranking alone when schools are weighted out, whatever the filter', () => {
    const noSchools = { ...base, weights: { schools: 'none', transport: 'somewhat', gp_access: 'somewhat' } } as const
    const a = rankAreas(areas, { ...noSchools, schoolFilter: { levels: ['primary'], sectors: ['catholic'] } })
    const b = rankAreas(areas, { ...noSchools, schoolFilter: { levels: ['secondary'], sectors: ['government'] } })
    expect(a.map((x) => x.lga_code)).toEqual(b.map((x) => x.lga_code))
  })

  it('still ranks every area when a filter matches almost nothing', () => {
    const scored = rankAreas(areas, {
      ...base,
      schoolFilter: { levels: ['secondary'], sectors: ['independent'] }
    })
    expect(scored).toHaveLength(areas.length)
    for (const area of scored) expect(Number.isFinite(area.score), area.lga_name).toBe(true)
  })
})
