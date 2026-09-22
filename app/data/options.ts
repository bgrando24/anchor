export type PriorityTier = 'not_much' | 'somewhat' | 'a_lot'

export const PRIORITY_TIERS: { value: PriorityTier; label: string }[] = [
  { value: 'not_much', label: 'Not much' },
  { value: 'somewhat', label: 'Somewhat' },
  { value: 'a_lot', label: 'A lot' }
]

export interface PriorityFactor {
  key: 'schools' | 'transport' | 'gp_access'
  /** Used in the scoring split box and the detail breakdown. */
  label: string
  /** The priorities question, written so it reads aloud with its answer. */
  question: string
  hint: string
}

export const PRIORITY_FACTORS: PriorityFactor[] = [
  {
    key: 'schools',
    label: 'Schools',
    question: 'How much do schools matter to you?',
    hint: 'Based on the number of schools in each area.'
  },
  {
    key: 'transport',
    label: 'Train stations',
    question: 'How much does being near a train station matter to you?',
    hint: 'Based on the number of train stations in each area.'
  },
  {
    key: 'gp_access',
    label: 'Bulk-billing doctors',
    question: 'How much do bulk-billing doctors matter to you?',
    hint: 'Based on how often GP visits in each area are bulk-billed (free).'
  }
]

export { PAYMENT_TYPES, INCOME_BANDS, BEDROOM_OPTIONS } from './payments'
export type { PaymentType, IncomeBand } from './payments'
