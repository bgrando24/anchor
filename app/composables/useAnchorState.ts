import { PAYMENT_TYPES, INCOME_BANDS } from '~/data/options'
import type { Bedrooms, PriorityWeights } from './useScoring'
import { TIER_FROM_CODE, weightsCode } from './useScoring'
import { useLgaData } from './useLgaData'

export type AnchorWeights = PriorityWeights

export interface AnchorAnswers {
  paymentType: string | null
  incomeBand: string | null
  bedrooms: Bedrooms | null
  currentLga: number | null
  weights: AnchorWeights
}

export function defaultAnswers(): AnchorAnswers {
  return {
    paymentType: null,
    incomeBand: null,
    bedrooms: null,
    currentLga: null,
    weights: { schools: 'somewhat', transport: 'somewhat', gp_access: 'somewhat' }
  }
}

export function useAnchorState() {
  const answers = useState<AnchorAnswers>('anchor-answers', defaultAnswers)

  function reset() {
    answers.value = defaultAnswers()
  }

  const isComplete = computed(() => answersComplete(answers.value))

  return { answers, reset, isComplete }
}

export function answersComplete(a: AnchorAnswers): boolean {
  return a.paymentType != null && a.bedrooms != null && a.currentLga != null
}

/** The first step the user still has to answer, used to bounce deep links back into the flow. */
export function firstUnansweredStep(a: AnchorAnswers): string | null {
  if (a.paymentType == null) return '/income'
  if (a.bedrooms == null) return '/bedrooms'
  if (a.currentLga == null) return '/location'
  return null
}

// State lives in the URL fragment because browsers never send it to the server.
// v2 format: #2.<payment>.<income>.<bedrooms>.<currentLga>.<weights>, e.g. #2.pps.200-500.2.27260.asa
// The version prefix makes v1 links (whose area codes belonged to a fixture) fail loudly.
export const FRAGMENT_VERSION = '2'

export function encodeAnswersToFragment(a: AnchorAnswers): string {
  const payment = PAYMENT_TYPES.find((p) => p.value === a.paymentType)?.code ?? '-'
  const income = INCOME_BANDS.find((b) => b.value === a.incomeBand)?.code ?? '-'
  const bedrooms = a.bedrooms != null ? String(a.bedrooms) : '-'
  const current = a.currentLga != null ? String(a.currentLga) : '-'
  return `#${[FRAGMENT_VERSION, payment, income, bedrooms, current, weightsCode(a.weights)].join('.')}`
}

/** Returns null for anything malformed, non-canonical, or naming an area that isn't in the data. */
export function decodeAnswersFromFragment(hash: string | null | undefined): AnchorAnswers | null {
  if (!hash) return null
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return null

  const parts = raw.split('.')
  if (parts.length !== 6) return null
  const [version, paymentCode, incomeCode, bedroomsCode, currentRaw, weights] = parts

  if (version !== FRAGMENT_VERSION) return null

  const payment = PAYMENT_TYPES.find((p) => p.code === paymentCode)
  if (!payment) return null

  let incomeBand: string | null = null
  if (incomeCode !== '-') {
    const band = INCOME_BANDS.find((b) => b.code === incomeCode)
    if (!band) return null
    incomeBand = band.value
  }

  if (bedroomsCode !== '1' && bedroomsCode !== '2' && bedroomsCode !== '3') return null
  const bedrooms = Number(bedroomsCode) as Bedrooms

  // Exactly five digits, so leading zeros, exponents, hex and whitespace are all rejected.
  if (!currentRaw || !/^\d{5}$/.test(currentRaw)) return null
  const currentLga = Number(currentRaw)
  if (!useLgaData().byCode(currentLga)) return null

  if (!weights || !/^[nsa]{3}$/.test(weights)) return null
  const [sc, tr, gp] = weights.split('')

  return {
    paymentType: payment.value,
    incomeBand,
    bedrooms,
    currentLga,
    weights: {
      schools: TIER_FROM_CODE[sc!]!,
      transport: TIER_FROM_CODE[tr!]!,
      gp_access: TIER_FROM_CODE[gp!]!
    }
  }
}
