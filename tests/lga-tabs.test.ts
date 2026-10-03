import { describe, expect, it } from 'vitest'
import { LGA_TAB_KEYS, orderedLgaTabs, type LgaTabKey } from '../app/composables/useLgaTabs'
import type { PriorityWeights } from '../app/composables/useScoring'

const weights = (over: Partial<PriorityWeights> = {}): PriorityWeights => ({
  schools: 'somewhat',
  transport: 'somewhat',
  gp_access: 'somewhat',
  ...over
})

const keys = (w?: PriorityWeights) => orderedLgaTabs(w).map((t) => t.key)

describe('the area page tabs', () => {
  it('always offers every tab exactly once', () => {
    for (const w of [undefined, weights(), weights({ schools: 'a_lot' }), weights({ schools: 'not_much' })]) {
      const got = keys(w)
      expect([...got].sort()).toEqual([...LGA_TAB_KEYS].sort())
      expect(new Set(got).size).toBe(got.length)
    }
  })

  it('opens on Overview, with rent next whatever the user said', () => {
    // Rent is half the score for everyone, so it is never pushed down the strip.
    for (const w of [
      undefined,
      weights(),
      weights({ schools: 'a_lot', transport: 'a_lot' }),
      weights({ schools: 'not_much', transport: 'not_much' })
    ]) {
      expect(keys(w).slice(0, 2)).toEqual(['overview', 'rent'])
    }
  })

  it('moves schools forward for someone who cares about schools', () => {
    expect(keys(weights({ schools: 'a_lot', transport: 'not_much' }))).toEqual([
      'overview',
      'rent',
      'schools',
      'sport',
      'transport'
    ])
  })

  it('puts schools last when the user says schools barely matter', () => {
    const got = keys(weights({ schools: 'not_much' }))
    expect(got.at(-1)).toBe('schools')
  })

  it('moves transport forward for someone who relies on trains', () => {
    const got = keys(weights({ transport: 'a_lot', schools: 'not_much' }))
    expect(got).toEqual(['overview', 'rent', 'transport', 'sport', 'schools'])
  })

  it('keeps sport in the middle rather than sinking it with schools', () => {
    // The sport tab is worth a look even for a family whose kids play nothing.
    const got = keys(weights({ schools: 'not_much' }))
    expect(got.indexOf('sport')).toBeLessThan(got.indexOf('schools'))
  })

  it('falls back to a fixed order before the user has answered anything', () => {
    expect(keys(undefined)).toEqual(['overview', 'rent', 'schools', 'sport', 'transport'])
  })

  it('labels rent "Rent", matching the score row and the headline', () => {
    const labels = Object.fromEntries(orderedLgaTabs().map((t) => [t.key, t.label]))
    expect(labels.rent).toBe('Rent')
    expect(Object.values(labels).every((l) => l.length > 0)).toBe(true)
  })

  it('gives every tab a short single-word label, so the strip stays narrow', () => {
    for (const tab of orderedLgaTabs()) {
      expect(tab.label.split(' '), `${tab.key} label`).toHaveLength(1)
      expect(tab.label.length, `${tab.key} label`).toBeLessThanOrEqual(10)
    }
  })

  it('every key the page can render has a tab', () => {
    const rendered: LgaTabKey[] = ['overview', 'rent', 'schools', 'sport', 'transport']
    expect([...LGA_TAB_KEYS].sort()).toEqual([...rendered].sort())
  })
})
