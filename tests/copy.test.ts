import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { lettingsLabel, ordinal, rowSentence, stationLabel, rankAreas } from '../app/composables/useScoring'
import type { Lga } from '../app/composables/useLgaData'
import lgaFile from '../app/data/lgas.json'

const areas = (lgaFile as unknown as { lgas: Lga[] }).lgas

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

const TEMPLATES = ['app/pages', 'app/components', 'app/layouts']
  .flatMap((dir) => walk(dir))
  .filter((p) => p.endsWith('.vue'))
  .map((p) => ({ path: p, text: readFileSync(p, 'utf8') }))

describe('the old copy is gone', () => {
  const retired = [
    'This is a suggestion, not an answer',
    "you can't change it",
    "There's no right answer",
    "Close the tab and they're gone",
    'No account, no sign-up',
    'nothing personal in the link',
    'left out of the score',
    'Where do you work',
    '>Bars<'
  ]

  for (const phrase of retired) {
    it(`no template says "${phrase}"`, () => {
      expect(TEMPLATES.filter((f) => f.text.includes(phrase)).map((f) => f.path)).toEqual([])
    })
  }
})

describe('no glyph icons or HTML entities', () => {
  it('uses SVG icons instead of symbols and entities', () => {
    const offenders = TEMPLATES.filter((f) => /&#\d|&larr;|&times;|&hellip;|&middot;|[☀◑←×−—]/.test(f.text))
    expect(offenders.map((f) => f.path)).toEqual([])
  })
})

describe('sentences are plural-safe', () => {
  it('stationLabel', () => {
    expect(stationLabel(0)).toBe('No train stations')
    expect(stationLabel(1)).toBe('1 train station')
    expect(stationLabel(4)).toBe('4 train stations')
  })

  it('ordinal', () => {
    expect([1, 2, 3, 4, 9, 11, 12, 13, 21, 35, 79].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '9th', '11th', '12th', '13th', '21st', '35th', '79th'
    ])
  })

  it('lettingsLabel reads 0 and 100 as words', () => {
    expect(lettingsLabel(0)).toBe('None')
    expect(lettingsLabel(100)).toBe('All')
    expect(lettingsLabel(48.9)).toBe('About 1 in 2')
    expect(lettingsLabel(2.6)).toBe('About 1 in 38')
  })
})

describe('row sentence', () => {
  const ranked = rankAreas(areas, {
    weeklyIncome: 1000,
    bedrooms: 2,
    weights: { schools: 'a_lot', transport: 'not_much', gp_access: 'not_much' }
  })

  it('says nothing when every priority is "Not much"', () => {
    const flat = rankAreas(areas, {
      weeklyIncome: 1000,
      bedrooms: 2,
      weights: { schools: 'not_much', transport: 'not_much', gp_access: 'not_much' }
    })
    expect(flat.every((r) => rowSentence(r, { schools: 'not_much', transport: 'not_much', gp_access: 'not_much' }) === null)).toBe(true)
  })

  it('only ever talks about a factor the user rated highest', () => {
    const weights = { schools: 'a_lot', transport: 'not_much', gp_access: 'not_much' } as const
    for (const r of ranked) {
      const sentence = rowSentence(r, weights)
      if (sentence) expect(sentence, r.lga_name).toMatch(/schools/)
    }
  })

  it('stays silent for the middle third', () => {
    const weights = { schools: 'a_lot', transport: 'not_much', gp_access: 'not_much' } as const
    const middle = ranked.filter((r) => r.ranks.schools > 10 / 3 && r.ranks.schools < 20 / 3)
    expect(middle.length).toBeGreaterThan(0)
    expect(middle.every((r) => rowSentence(r, weights) === null)).toBe(true)
  })

  it('never writes "1 train stations"', () => {
    const weights = { schools: 'not_much', transport: 'a_lot', gp_access: 'not_much' } as const
    for (const r of ranked) {
      const sentence = rowSentence(r, weights)
      if (sentence) expect(sentence, r.lga_name).not.toMatch(/\b1 train stations\b/)
    }
  })
})
