import { describe, expect, it } from 'vitest'
import { INCOME_BANDS, PAYMENT_TYPES, weeklyIncome } from '../app/data/payments'

describe('weeklyIncome', () => {
  it('halves the fortnightly payment when there is no other income', () => {
    expect(weeklyIncome('parenting_single', 'none')).toBeCloseTo(534.1)
    expect(weeklyIncome('parenting_single', null)).toBeCloseTo(534.1)
  })

  it('adds the midpoint of the other-income band', () => {
    // 1068.20 + 350 = 1418.20 a fortnight
    expect(weeklyIncome('parenting_single', '200_500')).toBeCloseTo(709.1)
    expect(weeklyIncome('jobseeker', '1000_plus')).toBeCloseTo((883.3 + 1250) / 2)
  })

  it('is zero without a payment, so no area can be banded', () => {
    expect(weeklyIncome(null, '200_500')).toBe(0)
  })
})

describe('payment and income options', () => {
  it('give every payment a rate and a source', () => {
    for (const p of PAYMENT_TYPES) {
      expect(p.maxFortnightly, p.label).toBeGreaterThan(0)
      expect(p.sourceUrl, p.label).toMatch(/^https:\/\/www\.servicesaustralia\.gov\.au\//)
      expect(p.effectiveDate, p.label).toBe('20 September 2026')
    }
  })

  it('use the codes the fragment format documents', () => {
    expect(PAYMENT_TYPES.map((p) => p.code)).toEqual(['js', 'pps', 'ppp', 'ya', 'ap'])
    expect(INCOME_BANDS.map((b) => b.code)).toEqual(['0', 'u200', '200-500', '500-1000', '1000+'])
    expect(INCOME_BANDS.map((b) => b.midpointFortnightly)).toEqual([0, 100, 350, 750, 1250])
  })
})
