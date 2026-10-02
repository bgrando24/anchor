import { BEDROOM_OPTIONS, INCOME_BANDS, PAYMENT_TYPES, PRIORITY_FACTORS, SCHOOL_LEVELS, SCHOOL_SECTORS } from '~/data/options'
import type { AnchorAnswers } from './useAnchorState'
import { schoolsStepComplete } from './useAnchorState'

/**
 * The questionnaire as a list, for the column beside the questions on a wide screen.
 *
 * Each step says what was answered, so someone four steps in can see what they told us without
 * going back for it, and can go back to any step they have already done.
 */

export interface QuestionStep {
  /** 1-based, matching the "Step N of 5" the progress bar shows. */
  number: number
  label: string
  path: string
  /** Answered far enough to move on. */
  done: boolean
  /** What they said, short enough to sit in a 300px column. Empty until answered. */
  answer: string
}

function list(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

export function incomeAnswer(a: AnchorAnswers): string {
  const payment = PAYMENT_TYPES.find((p) => p.value === a.paymentType)?.label
  if (!payment) return ''
  const band = INCOME_BANDS.find((b) => b.value === a.incomeBand)?.label
  // "None" already reads as an answer on its own, so it is not worth a second clause.
  return band && a.incomeBand !== 'none' ? `${payment}, plus ${band.toLowerCase()}` : payment
}

export function bedroomsAnswer(a: AnchorAnswers): string {
  return BEDROOM_OPTIONS.find((b) => b.value === a.bedrooms)?.label ?? ''
}

export function schoolsAnswer(a: AnchorAnswers): string {
  const s = a.schools
  if (s.hasKidsAtSchool === false) return 'No children at school'
  if (s.hasKidsAtSchool === null) return ''
  if (s.movingSchools === false) return 'Children staying at their school'
  if (s.movingSchools === null) return ''
  const levels = SCHOOL_LEVELS.filter((l) => s.levels.includes(l.value)).map((l) => l.label.toLowerCase())
  const sectors = SCHOOL_SECTORS.filter((x) => s.sectors.includes(x.value)).map((x) => x.label.toLowerCase())
  if (!levels.length || !sectors.length) return ''
  return `${list(sectors)} ${list(levels)}`
}

export function prioritiesAnswer(a: AnchorAnswers): string {
  const most = PRIORITY_FACTORS.filter((f) => a.weights[f.key] === 'a_lot').map((f) => f.label.toLowerCase())
  if (most.length) return `${list(most)} matter most`
  const some = PRIORITY_FACTORS.filter((f) => a.weights[f.key] === 'somewhat')
  return some.length ? 'Evenly weighted' : 'Rent only'
}

/**
 * The five steps, in order, with what has been answered so far.
 *
 * `currentArea` is passed in rather than looked up, so this stays a plain function the tests can
 * call without a Nuxt app around it.
 */
export function questionSteps(a: AnchorAnswers, currentAreaName: string | null): QuestionStep[] {
  return [
    {
      number: 1,
      label: 'Your income',
      path: '/income',
      done: a.paymentType != null,
      answer: incomeAnswer(a)
    },
    {
      number: 2,
      label: 'Bedrooms',
      path: '/bedrooms',
      done: a.bedrooms != null,
      answer: bedroomsAnswer(a)
    },
    {
      number: 3,
      label: 'Where you live now',
      path: '/location',
      done: a.currentLga != null,
      answer: currentAreaName ?? ''
    },
    {
      number: 4,
      label: 'Schools',
      path: '/schools',
      done: schoolsStepComplete(a.schools),
      answer: schoolsAnswer(a)
    },
    {
      number: 5,
      label: 'What matters most',
      path: '/priorities',
      // The last step has no unanswered state: the tiers always hold a value.
      done: a.paymentType != null && a.bedrooms != null && a.currentLga != null && schoolsStepComplete(a.schools),
      answer: prioritiesAnswer(a)
    }
  ]
}
