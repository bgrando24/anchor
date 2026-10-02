import { describe, expect, it } from 'vitest'
import { questionSteps, incomeAnswer, bedroomsAnswer, schoolsAnswer, prioritiesAnswer } from '../app/composables/useQuestionSteps'
import { defaultAnswers, defaultSchoolAnswers, type AnchorAnswers } from '../app/composables/useAnchorState'

const answers = (over: Partial<AnchorAnswers> = {}): AnchorAnswers => ({ ...defaultAnswers(), ...over })

const complete = (): AnchorAnswers =>
  answers({
    paymentType: 'parenting_single',
    incomeBand: '200_500',
    bedrooms: 2,
    currentLga: 21610,
    schools: { hasKidsAtSchool: true, levels: ['primary'], sectors: ['government'], movingSchools: true }
  })

describe('the step list', () => {
  it('lists the five steps in the order they are asked', () => {
    const steps = questionSteps(defaultAnswers(), null)
    expect(steps.map((s) => s.number)).toEqual([1, 2, 3, 4, 5])
    expect(steps.map((s) => s.path)).toEqual(['/income', '/bedrooms', '/location', '/schools', '/priorities'])
  })

  it('marks nothing done before anything is answered', () => {
    expect(questionSteps(defaultAnswers(), null).every((s) => !s.done)).toBe(true)
  })

  it('marks a step done as soon as its own question is answered', () => {
    const steps = questionSteps(answers({ paymentType: 'jobseeker' }), null)
    expect(steps[0]!.done).toBe(true)
    expect(steps[1]!.done).toBe(false)
  })

  it('does not call the last step done until every earlier one is', () => {
    // Its tiers always hold a value, so it has no unanswered state of its own.
    expect(questionSteps(answers({ paymentType: 'jobseeker' }), null)[4]!.done).toBe(false)
    expect(questionSteps(complete(), 'Casey')[4]!.done).toBe(true)
  })

  it('shows what was answered, short enough for a narrow column', () => {
    const steps = questionSteps(complete(), 'Casey')
    for (const step of steps) {
      expect(step.answer, `${step.label}: "${step.answer}"`).not.toBe('')
      expect(step.answer.length, `${step.label} is too long for the column`).toBeLessThanOrEqual(60)
      expect(step.answer).not.toContain('undefined')
    }
    expect(steps[2]!.answer).toBe('Casey')
  })

  it('leaves the answer empty until the step is actually answered', () => {
    for (const step of questionSteps(defaultAnswers(), null)) {
      if (step.number === 5) continue // its tiers read as an answer from the start
      expect(step.answer, step.label).toBe('')
    }
  })
})

describe('the answers, written out', () => {
  it('names the payment, and the other income only when there is some', () => {
    expect(incomeAnswer(answers({ paymentType: 'jobseeker', incomeBand: 'none' }))).not.toContain('plus')
    expect(incomeAnswer(answers({ paymentType: 'jobseeker', incomeBand: '200_500' }))).toContain('plus')
  })

  it('says nothing about income before a payment is chosen', () => {
    expect(incomeAnswer(defaultAnswers())).toBe('')
  })

  it('names the bedrooms', () => {
    expect(bedroomsAnswer(answers({ bedrooms: 2 }))).toBeTruthy()
    expect(bedroomsAnswer(defaultAnswers())).toBe('')
  })

  it('covers every shape the schools step can end in', () => {
    const s = (over: object) => schoolsAnswer(answers({ schools: { ...defaultSchoolAnswers(), ...over } }))
    expect(s({})).toBe('')
    expect(s({ hasKidsAtSchool: false })).toBe('No children at school')
    expect(s({ hasKidsAtSchool: true, movingSchools: false })).toBe('Children staying at their school')
    expect(s({ hasKidsAtSchool: true, movingSchools: true, levels: ['primary'], sectors: ['government'] })).toBe(
      'government primary school'
    )
    expect(
      s({
        hasKidsAtSchool: true,
        movingSchools: true,
        levels: ['primary', 'secondary'],
        sectors: ['government', 'catholic', 'independent']
      })
    ).toBe('government, catholic and independent primary school and high school')
  })

  it('says which priorities were put first', () => {
    expect(prioritiesAnswer(answers({ weights: { schools: 'a_lot', transport: 'not_much', gp_access: 'not_much' } })))
      .toBe('schools matter most')
    expect(prioritiesAnswer(answers({ weights: { schools: 'a_lot', transport: 'a_lot', gp_access: 'not_much' } })))
      .toBe('schools and train stations matter most')
    expect(prioritiesAnswer(answers({ weights: { schools: 'somewhat', transport: 'somewhat', gp_access: 'somewhat' } })))
      .toBe('Evenly weighted')
    expect(prioritiesAnswer(answers({ weights: { schools: 'not_much', transport: 'not_much', gp_access: 'not_much' } })))
      .toBe('Rent only')
  })

  it('never writes a stray comma or a dangling and', () => {
    const weights = ['not_much', 'somewhat', 'a_lot'] as const
    for (const a of weights) for (const b of weights) for (const c of weights) {
      const text = prioritiesAnswer(answers({ weights: { schools: a, transport: b, gp_access: c } }))
      expect(text, text).not.toMatch(/,\s*$|\band\s*$|,\s*and\b.*,/)
    }
  })
})
