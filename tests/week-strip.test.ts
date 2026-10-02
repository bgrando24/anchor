import { describe, expect, it } from 'vitest'
import { overWholeIncomeNote, weekStrip } from '../app/composables/useWeekStrip'
import { rankAreas } from '../app/composables/useScoring'
import type { Lga } from '../app/composables/useLgaData'
import lgaFile from '../app/data/lgas.json'

const areas = (lgaFile as unknown as { lgas: Lga[] }).lgas

describe('the week strip', () => {
  it('has nothing to draw without a rent figure', () => {
    expect(weekStrip(null)).toBeNull()
    expect(weekStrip(undefined)).toBeNull()
  })

  it('has nothing to draw once rent takes the whole income', () => {
    // Days of the week stop meaning anything past a full week.
    expect(weekStrip(100)).toBeNull()
    expect(weekStrip(173)).toBeNull()
    expect(overWholeIncomeNote(117)).toBe('Rent would take more than your whole income.')
    expect(overWholeIncomeNote(99)).toBeNull()
  })

  it('fills one bar per weekday, from Monday', () => {
    const strip = weekStrip(50)!
    expect(strip.bars).toHaveLength(7)
    expect(strip.bars[0]!.day).toBe('Monday')
    expect(strip.bars[6]!.day).toBe('Sunday')
    // 50% is three and a half days: three full, one half, three empty.
    expect(strip.bars.map((b) => b.fill)).toEqual([1, 1, 1, 0.5, 0, 0, 0])
  })

  it('never fills a bar past full or below empty', () => {
    for (let pct = 1; pct < 100; pct++) {
      for (const bar of weekStrip(pct)!.bars) {
        expect(bar.fill).toBeGreaterThanOrEqual(0)
        expect(bar.fill).toBeLessThanOrEqual(1)
      }
    }
  })

  it('says "about" when the figure is close to a half day', () => {
    // 28% is 1.96 days: four hundredths off two.
    expect(weekStrip(28)!.headline).toBe('Rent uses about two days of your income each week.')
  })

  it('says "almost" when it falls short of the nearest half', () => {
    // 34% is 2.38 days, which is 0.12 short of two and a half.
    expect(weekStrip(34)!.headline).toBe('Rent uses almost two and a half days of your income each week.')
  })

  it('says "just over" when it passes the nearest half', () => {
    // 38% is 2.66 days, 0.16 past two and a half.
    expect(weekStrip(38)!.headline).toBe('Rent uses just over two and a half days of your income each week.')
  })

  it('writes one day in the singular', () => {
    expect(weekStrip(14)!.headline).toContain('one day of your income')
    expect(weekStrip(14)!.headline).not.toContain('one days')
  })

  it('calls a sliver less than half a day', () => {
    expect(weekStrip(2)!.headline).toBe('Rent uses less than half a day of your income each week.')
  })

  it('names the days the rent covers', () => {
    // 27% is 1.89 days: all of Monday and almost all of Tuesday.
    expect(weekStrip(27)!.body).toBe(
      "If your income came in evenly across the week, all of Monday's and almost all of Tuesday's would go on rent."
    )
  })

  it('calls a middling part of a day a part', () => {
    // 36% is 2.52 days.
    expect(weekStrip(36)!.body).toContain("all of Monday's, all of Tuesday's and part of Wednesday's")
  })

  it('always leaves a day named, even for a sliver', () => {
    expect(weekStrip(1)!.body).toContain("part of Monday's")
  })

  it('reads the strip out to a screen reader as the headline', () => {
    const strip = weekStrip(48)!
    expect(strip.label).toBe(strip.headline)
  })

  it('never writes a broken sentence for any share a real area can produce', () => {
    for (let pct = 1; pct < 100; pct++) {
      const strip = weekStrip(pct)!
      for (const text of [strip.headline, strip.body]) {
        expect(text, `${pct}%`).not.toContain('undefined')
        expect(text, `${pct}%`).not.toContain('NaN')
        expect(text, `${pct}%`).not.toMatch(/\bone days\b/)
        expect(text, `${pct}%`).not.toMatch(/,\s*and\b.*,\s*and\b/)
      }
      expect(strip.headline).toMatch(/^Rent uses .+ of your income each week\.$/)
      expect(strip.body).toMatch(/^If your income came in evenly across the week, .+ would go on rent\.$/)
    }
  })

  it('covers every real area at a low, middling and high income', () => {
    for (const weeklyIncome of [600, 900, 1400]) {
      for (const bedrooms of [1, 2, 3] as const) {
        const scored = rankAreas(areas, {
          weeklyIncome,
          bedrooms,
          weights: { schools: 'somewhat', transport: 'somewhat', gp_access: 'somewhat' }
        })
        for (const area of scored) {
          const strip = weekStrip(area.rentSharePct)
          const over = overWholeIncomeNote(area.rentSharePct)
          // Exactly one of the three outcomes applies: a strip, the over-income note, or neither
          // because there is no rent figure at all.
          const outcomes = [strip !== null, over !== null, area.rentSharePct == null]
          expect(outcomes.filter(Boolean), `${area.lga_name} ${bedrooms}br at ${weeklyIncome}`).toHaveLength(1)
        }
      }
    }
  })
})
