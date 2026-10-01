import { describe, expect, it } from 'vitest'
import seriesFile from '../app/data/affordability-series.json'
import lgaFile from '../app/data/lgas.json'
import {
  areaSeries,
  BEDROOM_FILTERS,
  pooledShares,
  trendWord,
  trendOver,
  type BedroomKey
} from '../app/composables/useAffordabilitySeries'
import { niceScale } from '../app/composables/useChartScale'

const file = seriesFile as unknown as Parameters<typeof areaSeries>[0]
const lgas = (lgaFile as { lgas: { lga_code: number; lga_name: string; affordable_lettings_pct: number }[] }).lgas

describe('the affordability series file', () => {
  it('covers every area the app ranks', () => {
    expect(Object.keys(file.series)).toHaveLength(lgas.length)
    for (const lga of lgas) {
      expect(file.series[String(lga.lga_code)], `${lga.lga_name} has no series`).toBeDefined()
    }
  })

  it('runs every quarter from Mar 2000 to Sep 2025', () => {
    expect(file.quarters).toHaveLength(103)
    expect(file.quarters[0]).toBe('Mar 2000')
    expect(file.quarters.at(-1)).toBe('Sep 2025')
  })

  it('holds one full-length series per bedroom size for every area', () => {
    for (const [code, block] of Object.entries(file.series)) {
      for (const key of file.bedrooms) {
        const series = block[key as BedroomKey]
        expect(series, `${code} is missing ${key}`).toBeDefined()
        expect(series.pct, `${code}/${key} shares`).toHaveLength(103)
        expect(series.n, `${code}/${key} counts`).toHaveLength(103)
      }
    }
  })

  it('stores shares as whole tenths of a percent, within range', () => {
    for (const [code, block] of Object.entries(file.series)) {
      for (const key of file.bedrooms) {
        for (const tenths of block[key as BedroomKey].pct) {
          expect(Number.isInteger(tenths), `${code}/${key} has a fractional share`).toBe(true)
          expect(tenths).toBeGreaterThanOrEqual(0)
          expect(tenths).toBeLessThanOrEqual(1000)
        }
      }
    }
  })

  it('agrees with the scored affordability figure in the latest quarter', () => {
    // Both come from the same Homes Victoria workbook; if they ever diverge, one is stale.
    for (const lga of lgas) {
      const series = areaSeries(file, lga.lga_code)!
      expect(series.shares.at(-1), lga.lga_name).toBeCloseTo(lga.affordable_lettings_pct, 1)
    }
  })

  it('only offers bedroom filters the file actually carries', () => {
    for (const filter of BEDROOM_FILTERS) {
      expect(file.bedrooms).toContain(filter.key)
    }
  })

  it('leaves one-bedroom data out of the filters, because it is too thin to chart', () => {
    expect(BEDROOM_FILTERS.map((f) => f.key)).not.toContain('br1')
  })
})

describe('areaSeries', () => {
  const code = lgas[0]!.lga_code

  it('converts tenths of a percent into percentages', () => {
    const raw = file.series[String(code)]!.all.pct
    const series = areaSeries(file, code)!
    expect(series.shares[0]).toBeCloseTo(raw[0]! / 10, 6)
  })

  it('returns null for an area or size it does not have', () => {
    expect(areaSeries(file, 999999)).toBeNull()
    expect(areaSeries(file, code, 'br9' as BedroomKey)).toBeNull()
  })
})

describe('pooledShares', () => {
  it('leaves a steady series where it is', () => {
    const series = { quarters: ['a', 'b', 'c', 'd'], shares: [10, 10, 10, 10], counts: [10, 10, 10, 10] }
    expect(pooledShares(series)).toEqual([10, 10, 10, 10])
  })

  it('weights each quarter by how many lettings it had, not equally', () => {
    // 50% of 2 lettings then 10% of 100: pooling the counts gives 11/102, not the 30% an
    // average of the two shares would claim.
    const series = { quarters: ['a', 'b'], shares: [50, 10], counts: [1, 10] }
    expect(pooledShares(series, 2)[1]).toBeCloseTo((11 / 102) * 100, 1)
  })

  it('keeps the raw share when a window has no lettings to pool', () => {
    const series = { quarters: ['a', 'b'], shares: [0, 0], counts: [0, 0] }
    expect(pooledShares(series, 2)).toEqual([0, 0])
  })

  it('steadies the real series without telling a different story', () => {
    const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length
    const swing = (v: number[]) => mean(v.slice(1).map((x, i) => Math.abs(x - v[i]!)))
    for (const lga of lgas.slice(0, 12)) {
      const series = areaSeries(file, lga.lga_code)!
      const pooled = pooledShares(series)
      expect(pooled).toHaveLength(series.shares.length)
      // Pooling weights quarters by their lettings, so the level shifts a little; it should
      // stay within a couple of points of the raw series rather than drifting off it.
      expect(mean(pooled), lga.lga_name).toBeCloseTo(mean(series.shares), -0.5)
      expect(Math.abs(mean(pooled) - mean(series.shares)), lga.lga_name).toBeLessThan(2)
      // The whole point: a markedly calmer line.
      expect(swing(pooled), `${lga.lga_name} should be calmer than raw`).toBeLessThan(swing(series.shares))
    }
  })
})

describe('trend wording', () => {
  it('scales the deadband to the level, so a flat high series is not called a fall', () => {
    // Ballarat ran 73.8% to 73.3% across 25 years and was reported as falling.
    expect(trendWord(73.8, 73.3)).toBe('stayed about the same')
    expect(trendWord(73.8, 60)).toBe('fell')
    // Near zero, a point and a half is the whole story.
    expect(trendWord(2.2, 0.4)).toBe('fell')
    expect(trendWord(1.2, 1.5)).toBe('stayed about the same')
  })

  it('takes an explicit deadband when a caller wants one', () => {
    expect(trendWord(50, 48, 10)).toBe('stayed about the same')
    expect(trendWord(50, 48, 0.5)).toBe('fell')
  })

  it('never calls a real collapse flat', () => {
    for (const lga of lgas) {
      const series = areaSeries(file, lga.lga_code)!
      const trend = trendOver(series)
      if (trend.from - trend.to > 10) {
        expect(trend.word, `${lga.lga_name} dropped ${trend.from}% to ${trend.to}%`).toBe('fell')
      }
    }
  })

  it('compares the first and last year of the real series', () => {
    const series = areaSeries(file, lgas[0]!.lga_code)!
    const trend = trendOver(series)
    expect(trend.fromLabel).toBe('Mar 2000')
    expect(trend.toLabel).toBe('Sep 2025')
    expect(trend.fromYear).toBe('2000')
    expect(trend.word).toMatch(/rose|fell|stayed about the same/)
  })

  it('opens a five-year window at the last twenty quarters, not at the start', () => {
    const series = areaSeries(file, lgas[0]!.lga_code)!
    const recent = trendOver(series, 5)
    expect(recent.fromLabel).toBe('Dec 2020')
    expect(recent.fromYear).toBe('2020')
    expect(recent.toLabel).toBe('Sep 2025')
    expect(series.quarters.length - series.quarters.indexOf(recent.fromLabel)).toBe(20)
  })

  it('falls back to the whole series when the window is longer than the data', () => {
    const series = areaSeries(file, lgas[0]!.lga_code)!
    expect(trendOver(series, 500).fromLabel).toBe('Mar 2000')
  })

  it('reads a window off a short series without going out of bounds', () => {
    const tiny = { quarters: ['Mar 2024', 'Jun 2024'], shares: [10, 20], counts: [1, 2] }
    const trend = trendOver(tiny, 5)
    expect(Number.isFinite(trend.from)).toBe(true)
    expect(Number.isFinite(trend.to)).toBe(true)
  })

  it('gives every real area a usable figure for both windows', () => {
    for (const lga of lgas) {
      const series = areaSeries(file, lga.lga_code)!
      for (const years of [undefined, 5]) {
        const trend = trendOver(series, years)
        expect(Number.isFinite(trend.from), `${lga.lga_name} ${years}`).toBe(true)
        expect(Number.isFinite(trend.to), `${lga.lga_name} ${years}`).toBe(true)
        expect(trend.from).toBeGreaterThanOrEqual(0)
        expect(trend.to).toBeLessThanOrEqual(100)
        expect(trend.fromYear).toMatch(/^\d{4}$/)
      }
    }
  })

  it('reads a fall off a declining series, not one noisy quarter', () => {
    const shares = Array.from({ length: 8 }, (_, i) => 40 - i * 4)
    shares[3] = 90 // one absurd quarter in the middle
    expect(trendOver({ quarters: shares.map(String), shares, counts: shares.map(() => 50) }).word).toBe('fell')
  })
})

describe('the chart can draw every real series', () => {
  // The chart maps a value to a y with (v - lo) / (hi - lo); a zero or inverted span there
  // would put NaN into the SVG path and the line would silently vanish.
  it('produces a usable y-axis for every area and bedroom size', () => {
    for (const [code, block] of Object.entries(file.series)) {
      for (const key of file.bedrooms) {
        const shares = block[key as BedroomKey].pct.map((t) => t / 10)
        const { lo, hi, ticks } = niceScale(shares)
        const where = `${code}/${key}`
        expect(Number.isFinite(lo), where).toBe(true)
        expect(Number.isFinite(hi), where).toBe(true)
        expect(hi, `${where} span`).toBeGreaterThan(lo)
        expect(lo, `${where} floor`).toBeLessThanOrEqual(Math.min(...shares))
        expect(hi, `${where} ceiling`).toBeGreaterThanOrEqual(Math.max(...shares))
        for (const tick of ticks) expect(Number.isFinite(tick), `${where} tick`).toBe(true)
        for (const share of shares) {
          const y = (share - lo) / (hi - lo)
          expect(Number.isFinite(y), `${where} point`).toBe(true)
          expect(y).toBeGreaterThanOrEqual(0)
          expect(y).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  it('handles a flat series, which a small area can produce', () => {
    const { lo, hi } = niceScale([0, 0, 0, 0])
    expect(hi).toBeGreaterThan(lo)
  })

  it('keeps a pooled series drawable too', () => {
    for (const lga of lgas.slice(0, 12)) {
      const pooled = pooledShares(areaSeries(file, lga.lga_code)!)
      const { lo, hi } = niceScale(pooled)
      expect(hi, lga.lga_name).toBeGreaterThan(lo)
      for (const share of pooled) expect(Number.isFinite((share - lo) / (hi - lo))).toBe(true)
    }
  })
})
