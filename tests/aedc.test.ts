import { describe, expect, it } from 'vitest'
import { aedcDirection, noiseBandPp, summariseAedc } from '../app/composables/useAedc'
import type { AedcPoint } from '../app/composables/useLgaData'
import lgaFile from '../app/data/lgas.json'
import type { Lga } from '../app/composables/useLgaData'

const areas = (lgaFile as unknown as { lgas: Lga[] }).lgas
const point = (year: number, vulnerable_pct: number, valid_n: number | null): AedcPoint => ({
  year,
  vulnerable_pct,
  valid_n,
  vulnerable_n: valid_n === null ? null : Math.round((vulnerable_pct / 100) * valid_n)
})

describe('whether an AEDC change means anything', () => {
  it('calls a real move on a big cohort a rise', () => {
    // Casey: 19.7% of 5,315 to 25.4% of 5,268.
    expect(aedcDirection(point(2021, 19.7, 5315), point(2024, 25.4, 5268))).toBe('rose')
  })

  it('will not call the same move a rise on a cohort of fifty', () => {
    expect(aedcDirection(point(2021, 19.7, 50), point(2024, 25.4, 50))).toBe('about the same')
  })

  it('still reports a move too big to be sampling', () => {
    // West Wimmera: 29.0% to 7.0% on about forty children.
    expect(aedcDirection(point(2021, 29, 42), point(2024, 7, 43))).toBe('fell')
  })

  it('widens the band as the cohort shrinks', () => {
    const big = noiseBandPp(point(2021, 20, 5000), point(2024, 20, 5000))
    const small = noiseBandPp(point(2021, 20, 50), point(2024, 20, 50))
    expect(small).toBeGreaterThan(big)
    expect(big).toBeLessThan(2)
    expect(small).toBeGreaterThan(10)
  })

  it('asks for a wide move when the cohort size is missing', () => {
    expect(aedcDirection(point(2021, 20, null), point(2024, 22, null))).toBe('about the same')
    expect(aedcDirection(point(2021, 20, null), point(2024, 40, null))).toBe('rose')
  })
})

describe('the AEDC summary', () => {
  it('has nothing to say for an area with no rounds', () => {
    expect(summariseAedc(null)).toBeNull()
    expect(summariseAedc([])).toBeNull()
  })

  it('reads the latest round against the one before', () => {
    const summary = summariseAedc([point(2021, 19.7, 5315), point(2024, 25.4, 5268)])!
    expect(summary.sentence).toBe(
      '25.4% of children starting school in 2024 were assessed as needing extra support in at least one part of their development, up from 19.7% in 2021.'
    )
  })

  it('says "about the same" rather than inventing a trend', () => {
    const summary = summariseAedc([point(2021, 8.8, 114), point(2024, 17.5, 114)])!
    expect(summary.sentence).toContain('about the same as in 2021')
    expect(summary.direction).toBe('about the same')
  })

  it('orders the rounds oldest first, whatever order they arrive in', () => {
    const summary = summariseAedc([point(2024, 25, 100), point(2009, 20, 100), point(2015, 22, 100)])!
    expect(summary.years).toEqual(['2009', '2015', '2024'])
    expect(summary.shares).toEqual([20, 22, 25])
    expect(summary.latest.year).toBe(2024)
  })

  it('copes with a single round', () => {
    const summary = summariseAedc([point(2024, 25, 100)])!
    expect(summary.previous).toBeNull()
    expect(summary.direction).toBeNull()
    expect(summary.sentence).toMatch(/^25\.0% of children starting school in 2024/)
    expect(summary.sentence).not.toContain('from')
  })

  it('says how many children the figure rests on', () => {
    expect(summariseAedc([point(2024, 25, 5268)])!.cohortNote).toBe('Based on 5,268 children in 2024.')
  })

  it('reads sensibly for every real area that has the data', () => {
    const withData = areas.filter((a) => a.aedc)
    expect(withData.length).toBe(78)
    for (const area of withData) {
      const summary = summariseAedc(area.aedc)!
      expect(summary.years, area.lga_name).toHaveLength(6)
      expect(summary.sentence, area.lga_name).toMatch(/^\d+\.\d% of children starting school in 2024/)
      expect(summary.sentence).not.toContain('undefined')
      expect(summary.sentence).not.toContain('NaN')
      for (const share of summary.shares) {
        expect(share).toBeGreaterThanOrEqual(0)
        expect(share).toBeLessThanOrEqual(100)
      }
    }
  })

  it('leaves the one suppressed area without a section', () => {
    const queenscliffe = areas.find((a) => a.lga_name === 'Queenscliffe')!
    expect(queenscliffe.aedc).toBeNull()
    expect(summariseAedc(queenscliffe.aedc)).toBeNull()
  })
})
