import { describe, expect, it } from 'vitest'
import {
  answersComplete,
  decodeAnswersFromFragment,
  defaultAnswers,
  encodeAnswersToFragment,
  firstUnansweredStep,
  type AnchorAnswers
} from '../app/composables/useAnchorState'
import { INCOME_BANDS, PAYMENT_TYPES } from '../app/data/payments'
import type { Bedrooms } from '../app/composables/useScoring'
import type { PriorityTier } from '../app/data/options'
import lgaFile from '../app/data/lgas.json'
import type { Lga } from '../app/composables/useLgaData'

const areas = (lgaFile as unknown as { lgas: Lga[] }).lgas
const CASEY = 21610
const WYNDHAM = 27260

const TIERS: PriorityTier[] = ['not_much', 'somewhat', 'a_lot']

function answers(over: Partial<AnchorAnswers> = {}): AnchorAnswers {
  return {
    paymentType: 'parenting_single',
    incomeBand: '200_500',
    bedrooms: 2,
    currentLga: WYNDHAM,
    weights: { schools: 'a_lot', transport: 'somewhat', gp_access: 'a_lot' },
    ...over
  }
}

describe('encode', () => {
  it('writes the documented format', () => {
    expect(encodeAnswersToFragment(answers())).toBe('#2.pps.200-500.2.27260.asa')
  })
})

describe('round trip', () => {
  it('survives every combination of options', () => {
    for (const payment of PAYMENT_TYPES) {
      for (const band of [...INCOME_BANDS.map((b) => b.value), null]) {
        for (const bedrooms of [1, 2, 3] as Bedrooms[]) {
          for (const schools of TIERS) {
            for (const transport of TIERS) {
              for (const gp_access of TIERS) {
                const a = answers({
                  paymentType: payment.value,
                  incomeBand: band,
                  bedrooms,
                  weights: { schools, transport, gp_access }
                })
                const decoded = decodeAnswersFromFragment(encodeAnswersToFragment(a))
                expect(decoded, encodeAnswersToFragment(a)).toEqual(a)
              }
            }
          }
        }
      }
    }
  })

  it('accepts every real area code', () => {
    for (const area of areas) {
      const a = answers({ currentLga: area.lga_code })
      expect(decodeAnswersFromFragment(encodeAnswersToFragment(a))?.currentLga).toBe(area.lga_code)
    }
  })
})

describe('rejects', () => {
  const bad: [string, string][] = [
    ['empty', ''],
    ['hash only', '#'],
    ['v1 link', '#pps.10-20.24970.-.asa'],
    ['v1 link with hash', '#js.-.24970.-.sss'],
    ['wrong version', '#1.pps.200-500.2.27260.asa'],
    ['version 3', '#3.pps.200-500.2.27260.asa'],
    ['no version', '#pps.200-500.2.27260.asa'],
    ['too few segments', '#2.pps.200-500.2.27260'],
    ['too many segments', '#2.pps.200-500.2.27260.asa.asa'],
    ['unknown payment', '#2.zz.200-500.2.27260.asa'],
    ['blank payment', '#2.-.200-500.2.27260.asa'],
    ['unknown income band', '#2.pps.10-20.2.27260.asa'],
    ['bedrooms 0', '#2.pps.200-500.0.27260.asa'],
    ['bedrooms 4', '#2.pps.200-500.4.27260.asa'],
    ['bedrooms blank', '#2.pps.200-500.-.27260.asa'],
    ['bedrooms decimal', '#2.pps.200-500.2.5.27260.asa'],
    ['leading zero on the area', '#2.pps.200-500.2.021610.asa'],
    ['short area code', '#2.pps.200-500.2.2161.asa'],
    ['exponent area code', '#2.pps.200-500.2.2497e1.asa'],
    ['hex area code', '#2.pps.200-500.2.0x6112.asa'],
    ['spaces in the area code', '#2.pps.200-500.2. 27260.asa'],
    ['area code not in the data', '#2.pps.200-500.2.99999.asa'],
    ['fixture area code', '#2.pps.200-500.2.90012.asa'],
    ['uppercase weights', '#2.pps.200-500.2.27260.ASA'],
    ['unknown weight letter', '#2.pps.200-500.2.27260.axa'],
    ['too few weights', '#2.pps.200-500.2.27260.as'],
    ['too many weights', '#2.pps.200-500.2.27260.asaa'],
    ['leading dot', '#.2.pps.200-500.2.27260.asa'],
    ['trailing dot', '#2.pps.200-500.2.27260.asa.'],
    ['double hash', '##2.pps.200-500.2.27260.asa'],
    ['markup payload', '#2.<img src=x onerror=alert(1)>.200-500.2.27260.asa'],
    ['very long', '#2.pps.200-500.2.27260.' + 'a'.repeat(5000)]
  ]

  for (const [name, hash] of bad) {
    it(name, () => expect(decodeAnswersFromFragment(hash)).toBeNull())
  }

  it('null and undefined', () => {
    expect(decodeAnswersFromFragment(null)).toBeNull()
    expect(decodeAnswersFromFragment(undefined)).toBeNull()
  })
})

describe('v1 links can never restore the wrong area', () => {
  // Six fixture codes belonged to different real councils (QA §5).
  const collisions = ['24970', '22110', '22910', '23430', '24330', '20830']
  it('rejects every one of them in the v1 shape', () => {
    for (const code of collisions) {
      expect(decodeAnswersFromFragment(`#pps.10-20.${code}.-.asa`)).toBeNull()
    }
  })
})

describe('answer completeness', () => {
  it('needs payment, bedrooms and area', () => {
    expect(answersComplete(defaultAnswers())).toBe(false)
    expect(answersComplete(answers())).toBe(true)
    expect(answersComplete(answers({ incomeBand: null }))).toBe(true)
    expect(answersComplete(answers({ bedrooms: null }))).toBe(false)
    expect(answersComplete(answers({ currentLga: null }))).toBe(false)
  })

  it('points at the first unanswered step', () => {
    expect(firstUnansweredStep(defaultAnswers())).toBe('/income')
    expect(firstUnansweredStep(answers({ bedrooms: null }))).toBe('/bedrooms')
    expect(firstUnansweredStep(answers({ currentLga: null }))).toBe('/location')
    expect(firstUnansweredStep(answers({ currentLga: CASEY }))).toBeNull()
  })
})
