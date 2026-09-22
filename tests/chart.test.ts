import { describe, expect, it } from 'vitest'
import { niceScale } from '../app/composables/useChartScale'
import fixture from './fixtures/legacy-fixture-lgas.json'
import lgaFile from '../app/data/lgas.json'
import type { Lga } from '../app/composables/useLgaData'

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

describe('the real affordable-lettings series', () => {
  const file = lgaFile as unknown as { meta: { lettingsQuarters: string[] }; lgas: Lga[] }

  it('covers every area for every quarter', () => {
    const n = file.meta.lettingsQuarters.length
    expect(n).toBeGreaterThan(1)
    expect(file.lgas).toHaveLength(79)
    for (const a of file.lgas) {
      expect(a.lettings_series_5yr, a.lga_name).not.toBeNull()
      expect(a.lettings_series_5yr!.length, a.lga_name).toBe(n)
      expect(a.lettings_series_5yr!.every((v) => typeof v === 'number' && v >= 0 && v <= 100), a.lga_name).toBe(true)
    }
  })

  it('ends on the same quarter as the headline affordability figure', () => {
    for (const a of file.lgas) {
      const last = a.lettings_series_5yr![a.lettings_series_5yr!.length - 1]!
      expect(Math.abs(last - a.affordable_lettings_pct), a.lga_name).toBeLessThanOrEqual(0.05)
    }
  })

  it('runs oldest to newest, ending at the rent quarter', () => {
    const q = file.meta.lettingsQuarters
    expect(q[0]).toBe('Sep 2020')
    expect(q[q.length - 1]).toBe('Sep 2025')
  })

  it('scales cleanly for every real series', () => {
    for (const a of file.lgas) {
      const { lo, hi } = niceScale(a.lettings_series_5yr!)
      expect(hi, a.lga_name).toBeGreaterThan(lo)
      expect(Math.min(...a.lettings_series_5yr!), a.lga_name).toBeGreaterThanOrEqual(lo)
      expect(Math.max(...a.lettings_series_5yr!), a.lga_name).toBeLessThanOrEqual(hi)
    }
  })
})
