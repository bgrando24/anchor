import { PAYMENT_TYPES, INCOME_BANDS, type PriorityTier } from '~/data/options'
import { useLgaData } from './useLgaData'

export interface AnchorWeights {
  schools: PriorityTier
  transport: PriorityTier
  gp_access: PriorityTier
}

export interface AnchorAnswers {
  paymentType: string | null
  incomeBand: string | null
  currentLga: number | null
  workLga: number | null
  weights: AnchorWeights
}

function defaultAnswers(): AnchorAnswers {
  return {
    paymentType: null,
    incomeBand: null,
    currentLga: null,
    workLga: null,
    weights: { schools: 'somewhat', transport: 'somewhat', gp_access: 'somewhat' }
  }
}

export function useAnchorState() {
  const answers = useState<AnchorAnswers>('anchor-answers', defaultAnswers)

  function reset() {
    answers.value = defaultAnswers()
  }

  return { answers, reset }
}

const TIER_CODE: Record<PriorityTier, string> = { not_much: 'n', somewhat: 's', a_lot: 'a' }
const TIER_FROM_CODE: Record<string, PriorityTier> = { n: 'not_much', s: 'somewhat', a: 'a_lot' }

// State lives in the URL fragment because browsers never send it to the server.
// Format: #<payment>.<income>.<currentLga>.<workLga or ->.<weights>, e.g. #pps.10-20.24970.-.ash
export function encodeAnswersToFragment(a: AnchorAnswers): string {
  const payment = PAYMENT_TYPES.find((p) => p.value === a.paymentType)?.code ?? '-'
  const income = INCOME_BANDS.find((b) => b.value === a.incomeBand)?.code ?? '-'
  const current = a.currentLga != null ? String(a.currentLga) : '-'
  const work = a.workLga != null ? String(a.workLga) : '-'
  const weights = `${TIER_CODE[a.weights.schools]}${TIER_CODE[a.weights.transport]}${TIER_CODE[a.weights.gp_access]}`
  return `#${[payment, income, current, work, weights].join('.')}`
}

// Returns null for anything malformed or naming an LGA code that isn't in the dataset.
export function decodeAnswersFromFragment(hash: string | null | undefined): AnchorAnswers | null {
  if (!hash) return null
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return null

  const parts = raw.split('.')
  if (parts.length !== 5) return null
  const [paymentCode, incomeCode, currentRaw, workRaw, weightsCode] = parts

  const payment = PAYMENT_TYPES.find((p) => p.code === paymentCode)
  if (!payment) return null

  const income = INCOME_BANDS.find((b) => b.code === incomeCode)
  if (!income) return null

  const { byCode } = useLgaData()

  if (currentRaw === '-' || !currentRaw) return null
  const currentLga = Number(currentRaw)
  if (!Number.isFinite(currentLga) || !byCode(currentLga)) return null

  let workLga: number | null = null
  if (workRaw && workRaw !== '-') {
    workLga = Number(workRaw)
    if (!Number.isFinite(workLga) || !byCode(workLga)) return null
  }

  if (!weightsCode || !/^[nsa]{3}$/.test(weightsCode)) return null
  const [sc, tr, gp] = weightsCode.split('')

  return {
    paymentType: payment.value,
    incomeBand: income.value,
    currentLga,
    workLga,
    weights: {
      schools: TIER_FROM_CODE[sc!]!,
      transport: TIER_FROM_CODE[tr!]!,
      gp_access: TIER_FROM_CODE[gp!]!
    }
  }
}
