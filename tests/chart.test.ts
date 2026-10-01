import { describe, expect, it } from 'vitest'
import { niceScale } from '../app/composables/useChartScale'
import fixture from './fixtures/legacy-fixture-lgas.json'

// The v2 data has no lettings series yet, so the chart is developed against the old fixture's
// 20-quarter series. It is never imported by app code.
const SERIES: number[][] = (fixture as { lgas: { affordability_series_5yr: number[] }[] }).lgas.map(
  (l) => l.affordability_series_5yr
)

describe('niceScale', () => {
  it('gives three rounded ticks that contain every point', () => {
    for (const series of SERIES) {
      const { lo, hi, ticks } = niceScale(series)
      expect(ticks).toHaveLength(3)
      expect(lo).toBeLessThan(hi)
      expect(lo).toBeGreaterThanOrEqual(0)
      expect(Math.min(...series)).toBeGreaterThanOrEqual(lo)
      expect(Math.max(...series)).toBeLessThanOrEqual(hi)
      expect(ticks).toEqual([lo, (lo + hi) / 2, hi])
    }
  })

  it('never collapses to a zero-height axis on a flat series', () => {
    const { lo, hi } = niceScale([12, 12, 12])
    expect(hi).toBeGreaterThan(lo)
  })

  it('picks readable round numbers', () => {
    expect(niceScale([2.7, 2.6, 3.1]).ticks).toEqual([2, 3, 4])
    expect(niceScale([12, 44]).ticks).toEqual([0, 30, 60])
  })

  it('has a 20-quarter series to develop against', () => {
    expect(SERIES.length).toBe(79)
    expect(SERIES.every((s) => s.length === 20)).toBe(true)
  })
})
