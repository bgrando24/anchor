import { describe, expect, it } from 'vitest'
import {
  answersComplete,
  decodeAnswersFromFragment,
  defaultAnswers,
  encodeAnswersToFragment,
  firstUnansweredStep,
  defaultSchoolAnswers,
  schoolsCode,
  schoolsFromCode,
  type AnchorAnswers,
  type SchoolAnswers
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

// One of each shape the schools segment can take.
const SCHOOL_CASES: SchoolAnswers[] = [
  { hasKidsAtSchool: null, levels: [], sectors: [], movingSchools: null },
  { hasKidsAtSchool: false, levels: [], sectors: [], movingSchools: null },
  { hasKidsAtSchool: true, levels: ['primary'], sectors: ['government'], movingSchools: true },
  { hasKidsAtSchool: true, levels: ['secondary'], sectors: ['catholic', 'independent'], movingSchools: false },
  {
    hasKidsAtSchool: true,
    levels: ['primary', 'secondary'],
    sectors: ['government', 'catholic', 'independent'],
    movingSchools: true
  },
  { hasKidsAtSchool: true, levels: [], sectors: [], movingSchools: null }
]

function answers(over: Partial<AnchorAnswers> = {}): AnchorAnswers {
  return {
    paymentType: 'parenting_single',
    incomeBand: '200_500',
    bedrooms: 2,
    currentLga: WYNDHAM,
    schools: { hasKidsAtSchool: true, levels: ['primary'], sectors: ['government'], movingSchools: true },
    weights: { schools: 'a_lot', transport: 'somewhat', gp_access: 'a_lot' },
    ...over
  }
}

const NO_KIDS: SchoolAnswers = { ...defaultSchoolAnswers(), hasKidsAtSchool: false }

describe('encode', () => {
  it('writes the documented format', () => {
    expect(encodeAnswersToFragment(answers())).toBe('#3.pps.200-500.2.27260.asa.p-g-y')
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
                for (const schoolAnswers of SCHOOL_CASES) {
                  const a = answers({
                    paymentType: payment.value,
                    incomeBand: band,
                    bedrooms,
                    schools: schoolAnswers,
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
    ['wrong version', '#1.pps.200-500.2.27260.asa.n'],
    ['version 2', '#2.pps.200-500.2.27260.asa.n'],
    ['no version', '#pps.200-500.2.27260.asa.n'],
    ['too few segments', '#3.pps.200-500.2.27260.asa'],
    ['too many segments', '#3.pps.200-500.2.27260.asa.n.n'],
    ['unknown payment', '#3.zz.200-500.2.27260.asa.n'],
    ['blank payment', '#3.-.200-500.2.27260.asa.n'],
    ['unknown income band', '#3.pps.10-20.2.27260.asa.n'],
    ['bedrooms 0', '#3.pps.200-500.0.27260.asa.n'],
    ['bedrooms 4', '#3.pps.200-500.4.27260.asa.n'],
    ['bedrooms blank', '#3.pps.200-500.-.27260.asa.n'],
    ['bedrooms decimal', '#3.pps.200-500.2.5.27260.asa'],
    ['leading zero on the area', '#3.pps.200-500.2.021610.asa.n'],
    ['short area code', '#3.pps.200-500.2.2161.asa.n'],
    ['exponent area code', '#3.pps.200-500.2.2497e1.asa.n'],
    ['hex area code', '#3.pps.200-500.2.0x6112.asa.n'],
    ['spaces in the area code', '#3.pps.200-500.2. 27260.asa.n'],
    ['area code not in the data', '#3.pps.200-500.2.99999.asa.n'],
    ['fixture area code', '#3.pps.200-500.2.90012.asa.n'],
    ['uppercase weights', '#3.pps.200-500.2.27260.ASA.n'],
    ['unknown weight letter', '#3.pps.200-500.2.27260.axa.n'],
    ['too few weights', '#3.pps.200-500.2.27260.as.n'],
    ['too many weights', '#3.pps.200-500.2.27260.asaa.n'],
    ['leading dot', '#.2.pps.200-500.2.27260.asa'],
    ['trailing dot', '#3.pps.200-500.2.27260.asa.n.'],
    ['double hash', '##2.pps.200-500.2.27260.asa'],
    ['markup payload', '#3.<img src=x onerror=alert(1)>.200-500.2.27260.asa.n'],
    ['very long', '#3.pps.200-500.2.27260..n' + 'a'.repeat(5000)]
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
      expect(decodeAnswersFromFragment(`#pps.10-20.${code}.-.asa.n`)).toBeNull()
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

describe('the schools segment', () => {
  it('writes one character when there are no children at school', () => {
    expect(schoolsCode(NO_KIDS)).toBe('n')
  })

  it('writes a dash before the step is answered', () => {
    expect(schoolsCode(defaultSchoolAnswers())).toBe('-')
  })

  it('writes levels, school types and the move answer', () => {
    expect(
      schoolsCode({
        hasKidsAtSchool: true,
        levels: ['primary', 'secondary'],
        sectors: ['government', 'independent'],
        movingSchools: true
      })
    ).toBe('ps-gi-y')
  })

  it('marks a part nothing has been chosen for, instead of leaving it blank', () => {
    // A blank part would read as another separator: "-----" used to split into five pieces.
    expect(schoolsCode({ hasKidsAtSchool: true, levels: [], sectors: [], movingSchools: null })).toBe('0-0-0')
    expect(schoolsFromCode('0-0-0')).toEqual({
      hasKidsAtSchool: true,
      levels: [],
      sectors: [],
      movingSchools: null
    })
  })

  it('always writes the same answers the same way', () => {
    const a = schoolsCode({
      hasKidsAtSchool: true,
      levels: ['secondary', 'primary'],
      sectors: ['independent', 'government'],
      movingSchools: false
    })
    const b = schoolsCode({
      hasKidsAtSchool: true,
      levels: ['primary', 'secondary'],
      sectors: ['government', 'independent'],
      movingSchools: false
    })
    expect(a).toBe(b)
    expect(a).toBe('ps-gi-n')
  })

  it('refuses anything this app would not have written', () => {
    const bad = [
      'y',
      'ps',
      'ps-gi',
      'ps-gi-y-n',
      'ps-gi-z',
      'sp-gi-y',
      'ps-ig-y',
      'pp-gi-y',
      'ps-gg-y',
      'ps-gix-y',
      'PS-GI-Y',
      'ps--y',
      '--',
      '1-1-1'
    ]
    for (const code of bad) {
      expect(schoolsFromCode(code), code).toBeNull()
    }
  })

  it('rejects a whole link whose schools segment is malformed', () => {
    for (const code of ['sp-gi-y', 'ps-gi', 'zzz']) {
      expect(decodeAnswersFromFragment(`#3.pps.200-500.2.27260.asa.${code}`), code).toBeNull()
    }
  })

  it('keeps the chosen schools tier in a link even when schools do not apply', () => {
    // Turning "considering moving schools" back on should restore the tier they picked, so the
    // tier travels in the link whether or not it is currently counting.
    const a = answers({ schools: NO_KIDS, weights: { schools: 'a_lot', transport: 'not_much', gp_access: 'not_much' } })
    const decoded = decodeAnswersFromFragment(encodeAnswersToFragment(a))
    expect(decoded?.weights.schools).toBe('a_lot')
    expect(decoded?.schools.hasKidsAtSchool).toBe(false)
  })
})

describe('the schools step gates the flow', () => {
  it('is not complete until the step is answered', () => {
    expect(answersComplete(answers({ schools: defaultSchoolAnswers() }))).toBe(false)
  })

  it('is complete as soon as there are no children at school', () => {
    expect(answersComplete(answers({ schools: NO_KIDS }))).toBe(true)
  })

  it('needs every follow-up once there are children at school', () => {
    const partial: SchoolAnswers[] = [
      { hasKidsAtSchool: true, levels: [], sectors: [], movingSchools: null },
      { hasKidsAtSchool: true, levels: ['primary'], sectors: [], movingSchools: null },
      { hasKidsAtSchool: true, levels: ['primary'], sectors: ['government'], movingSchools: null }
    ]
    for (const schools of partial) {
      expect(answersComplete(answers({ schools })), schoolsCode(schools)).toBe(false)
    }
  })

  it('sends an unanswered schools step to the schools page', () => {
    expect(firstUnansweredStep(answers({ schools: defaultSchoolAnswers() }))).toBe('/schools')
    expect(firstUnansweredStep(answers({ schools: NO_KIDS }))).toBeNull()
  })

  it('asks the earlier steps first', () => {
    expect(firstUnansweredStep(answers({ bedrooms: null, schools: defaultSchoolAnswers() }))).toBe('/bedrooms')
  })
})
