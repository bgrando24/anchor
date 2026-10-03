import { describe, expect, it } from 'vitest'
import { questionFrame } from '../app/composables/useQuestionFrame'
import type { AnchorAnswers } from '../app/composables/useAnchorState'

const EMPTY: AnchorAnswers = {
  paymentType: null,
  incomeBand: null,
  bedrooms: null,
  currentLga: null,
  schools: { hasKidsAtSchool: null, movingSchools: null, levels: [], sectors: [] },
  weights: { rent: 'somewhat', schools: 'somewhat', green: 'somewhat', sport: 'somewhat', transport: 'somewhat' }
}

describe('question frame', () => {
  // These are the values each page used to pass in by hand. They are the contract.
  it('matches what every step used to set for itself', () => {
    const expected = [
      ['/income', 1, '/', '/bedrooms', 'Continue'],
      ['/bedrooms', 2, '/income', '/location', 'Continue'],
      ['/location', 3, '/bedrooms', '/schools', 'Continue'],
      ['/location/area', 3, '/location', '/schools', 'Continue'],
      ['/schools', 4, '/location', '/priorities', 'Continue'],
      ['/priorities', 5, '/schools', '/results', 'Results']
    ] as const
    for (const [path, step, back, next, label] of expected) {
      const frame = questionFrame(path, EMPTY, null)
      expect(frame, `${path} has no frame`).not.toBeNull()
      expect(frame!.currentStep, `${path} step`).toBe(step)
      expect(frame!.backTo, `${path} back`).toBe(back)
      expect(frame!.continueTo, `${path} continue`).toBe(next)
      expect(frame!.continueLabel, `${path} label`).toBe(label)
    }
  })

  it('sends back from schools to the area list they came through', () => {
    expect(questionFrame('/schools', EMPTY, 'Loddon Mallee')!.backTo).toBe('/location/area?region=Loddon%20Mallee')
  })

  it('holds continue shut until the step is answered', () => {
    expect(questionFrame('/income', EMPTY, null)!.continueReady).toBe(false)
    // The payment alone is not the whole step. On a phone continue sits above the other-income
    // question, so going live on the first answer let testers past one they had not seen.
    const payment = { ...EMPTY, paymentType: 'parenting_single' } as AnchorAnswers
    expect(questionFrame('/income', payment, null)!.continueReady).toBe(false)
    const both = { ...payment, incomeBand: 'none' } as AnchorAnswers
    expect(questionFrame('/income', both, null)!.continueReady).toBe(true)
  })

  // "No other income" is an answer, not an absence of one.
  it('counts no other income as having answered', () => {
    const answered = { ...EMPTY, paymentType: 'parenting_single', incomeBand: 'none' } as AnchorAnswers
    expect(questionFrame('/income', answered, null)!.continueReady).toBe(true)
  })

  it('always lets the last step through, because its tiers always hold a value', () => {
    expect(questionFrame('/priorities', EMPTY, null)!.continueReady).toBe(true)
  })

  it('has no frame for a page that is not a question', () => {
    for (const path of ['/', '/results', '/results/21670', '/faq', '/share']) {
      expect(questionFrame(path, EMPTY, null), path).toBeNull()
    }
  })
})
