// Maximum fortnightly rates read from servicesaustralia.gov.au on 22 September 2026.
// Rates are indexed on 20 March and 20 September; these are the 20 September 2026 figures.
// Where a payment has several rates we take the single-with-dependent-children rate, because
// that is who this tool is for. Age Pension has no such rate, so the single rate is used.
export const RATES_SOURCE_DATE = '20 September 2026'

export const RATE_SOURCES = {
  jobseeker: 'https://www.servicesaustralia.gov.au/how-much-jobseeker-payment-you-can-get',
  parenting: 'https://www.servicesaustralia.gov.au/how-much-parenting-payment-you-can-get',
  youth_allowance: 'https://www.servicesaustralia.gov.au/how-much-youth-allowance-for-job-seekers-you-can-get',
  age_pension: 'https://www.servicesaustralia.gov.au/how-much-age-pension-you-can-get'
} as const

export interface PaymentType {
  value: string
  label: string
  code: string
  /** Maximum fortnightly payment, including supplements where the rate table lists them. */
  maxFortnightly: number
  /** Which of the payment's several rates this is. */
  rateBasis: string
  sourceUrl: string
  effectiveDate: string
}

// DSP and Carer Payment are left out on purpose: choosing one reveals health information.
export const PAYMENT_TYPES: PaymentType[] = [
  {
    value: 'jobseeker',
    label: 'JobSeeker Payment',
    code: 'js',
    maxFortnightly: 883.3,
    rateBasis: 'Single, with a dependent child or children',
    sourceUrl: RATE_SOURCES.jobseeker,
    effectiveDate: RATES_SOURCE_DATE
  },
  {
    value: 'parenting_single',
    label: 'Parenting Payment (single)',
    code: 'pps',
    maxFortnightly: 1068.2,
    rateBasis: 'Single ($1,037.50 plus the $30.70 pension supplement)',
    sourceUrl: RATE_SOURCES.parenting,
    effectiveDate: RATES_SOURCE_DATE
  },
  {
    value: 'parenting_partnered',
    label: 'Parenting Payment (partnered)',
    code: 'ppp',
    maxFortnightly: 755.1,
    rateBasis: 'Partnered',
    sourceUrl: RATE_SOURCES.parenting,
    effectiveDate: RATES_SOURCE_DATE
  },
  {
    value: 'youth_allowance',
    label: 'Youth Allowance',
    code: 'ya',
    maxFortnightly: 854.2,
    rateBasis: 'Single, with children',
    sourceUrl: RATE_SOURCES.youth_allowance,
    effectiveDate: RATES_SOURCE_DATE
  },
  {
    value: 'age_pension',
    label: 'Age Pension',
    code: 'ap',
    maxFortnightly: 1237.7,
    rateBasis: 'Single, total of the basic rate, pension supplement and energy supplement',
    sourceUrl: RATE_SOURCES.age_pension,
    effectiveDate: RATES_SOURCE_DATE
  }
]

export interface IncomeBand {
  value: string
  label: string
  code: string
  /** Midpoint of the band, per fortnight, used as the income estimate. */
  midpointFortnightly: number
}

export const INCOME_BANDS: IncomeBand[] = [
  { value: 'none', label: 'No other income', code: '0', midpointFortnightly: 0 },
  { value: 'under_200', label: 'Under $200 a fortnight', code: 'u200', midpointFortnightly: 100 },
  { value: '200_500', label: '$200 to $500 a fortnight', code: '200-500', midpointFortnightly: 350 },
  { value: '500_1000', label: '$500 to $1,000 a fortnight', code: '500-1000', midpointFortnightly: 750 },
  { value: '1000_plus', label: 'More than $1,000 a fortnight', code: '1000+', midpointFortnightly: 1250 }
]

export const BEDROOM_OPTIONS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: '1 bedroom' },
  { value: 2, label: '2 bedrooms' },
  { value: 3, label: '3 or more bedrooms' }
]

export function paymentByValue(value: string | null | undefined) {
  return PAYMENT_TYPES.find((p) => p.value === value)
}

export function incomeBandByValue(value: string | null | undefined) {
  return INCOME_BANDS.find((b) => b.value === value)
}

/** Weekly income from the payment's maximum rate plus the midpoint of the other-income band. */
export function weeklyIncome(paymentValue: string | null, incomeBandValue: string | null): number {
  const payment = paymentByValue(paymentValue)
  if (!payment) return 0
  const other = incomeBandByValue(incomeBandValue)?.midpointFortnightly ?? 0
  return (payment.maxFortnightly + other) / 2
}
