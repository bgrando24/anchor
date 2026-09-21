export interface PaymentType {
  value: string
  label: string
  code: string
}

// DSP and Carer Payment are left out on purpose: they imply health information.
export const PAYMENT_TYPES: PaymentType[] = [
  { value: 'jobseeker', label: 'JobSeeker Payment', code: 'js' },
  { value: 'parenting_single', label: 'Parenting Payment (single)', code: 'pps' },
  { value: 'parenting_partnered', label: 'Parenting Payment (partnered)', code: 'ppp' },
  { value: 'youth_allowance', label: 'Youth Allowance', code: 'ya' },
  { value: 'age_pension', label: 'Age Pension', code: 'ap' }
]

export interface IncomeBand {
  value: string
  label: string
  code: string
}

export const INCOME_BANDS: IncomeBand[] = [
  { value: 'none', label: 'None', code: '0' },
  { value: '0_10000', label: 'Under $10,000 a year', code: '0-10' },
  { value: '10000_20000', label: '$10,000 – $20,000 a year', code: '10-20' },
  { value: '20000_35000', label: '$20,000 – $35,000 a year', code: '20-35' },
  { value: '35000_plus', label: '$35,000 or more a year', code: '35+' }
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
