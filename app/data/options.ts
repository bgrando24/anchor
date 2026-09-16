// Fixed, non-free-text option sets for every input in the flow.
// No free text anywhere - every answer is one of these values (§4.1 of the UI brief).

export interface PaymentType {
  value: string
  label: string
}

// "Five modelled payments, ungrouped" - the design's own scoping decision (§13 Q3).
export const PAYMENT_TYPES: PaymentType[] = [
  { value: 'jobseeker', label: 'JobSeeker Payment' },
  { value: 'parenting_single', label: 'Parenting Payment (single)' },
  { value: 'parenting_partnered', label: 'Parenting Payment (partnered)' },
  { value: 'youth_allowance', label: 'Youth Allowance' },
  { value: 'age_pension', label: 'Age Pension' }
]

export interface IncomeBand {
  value: string
  label: string
  /** midpoint used only to reason about affordability - never shown as a precise figure */
  midpoint: number
}

export const INCOME_BANDS: IncomeBand[] = [
  { value: 'none', label: 'None', midpoint: 0 },
  { value: '0_10000', label: 'Under $10,000 a year', midpoint: 5000 },
  { value: '10000_20000', label: '$10,000 – $20,000 a year', midpoint: 15000 },
  { value: '20000_35000', label: '$20,000 – $35,000 a year', midpoint: 27500 },
  { value: '35000_plus', label: '$35,000 or more a year', midpoint: 40000 }
]

export type PriorityTier = 'not_much' | 'somewhat' | 'a_lot'

export const PRIORITY_TIERS: { value: PriorityTier; label: string }[] = [
  { value: 'not_much', label: 'Not much' },
  { value: 'somewhat', label: 'Somewhat' },
  { value: 'a_lot', label: 'A lot' }
]

export interface PriorityFactor {
  key: 'schools' | 'transport' | 'gp_access'
  label: string
  description: string
}

export const PRIORITY_FACTORS: PriorityFactor[] = [
  { key: 'schools', label: 'Schools', description: 'How many schools are in the area.' },
  { key: 'transport', label: 'Public transport', description: 'Train stations in the area.' },
  { key: 'gp_access', label: 'Bulk-billing doctors', description: 'How likely a GP visit is free.' }
]
