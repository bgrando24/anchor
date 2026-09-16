import type { PriorityTier } from '~/data/options'

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

/**
 * Session-wide wizard state. Nothing here is ever sent anywhere - it lives in memory
 * and, once the user reaches Results, in the URL query so the page is reloadable and
 * shareable without an account (see app/pages/share.vue).
 */
export function useAnchorState() {
  const answers = useState<AnchorAnswers>('anchor-answers', defaultAnswers)

  function reset() {
    answers.value = defaultAnswers()
  }

  return { answers }
}

const TIER_VALUES: Record<PriorityTier, string> = { not_much: 'n', somewhat: 's', a_lot: 'a' }
const TIER_FROM_CODE: Record<string, PriorityTier> = { n: 'not_much', s: 'somewhat', a: 'a_lot' }

/** Packs answers into short URL query params so a results/share link carries no personal data by name. */
export function encodeAnswersToQuery(a: AnchorAnswers): Record<string, string> {
  const q: Record<string, string> = {}
  if (a.paymentType) q.pt = a.paymentType
  if (a.incomeBand) q.ib = a.incomeBand
  if (a.currentLga != null) q.cl = String(a.currentLga)
  if (a.workLga != null) q.wl = String(a.workLga)
  q.sc = TIER_VALUES[a.weights.schools]
  q.tr = TIER_VALUES[a.weights.transport]
  q.gp = TIER_VALUES[a.weights.gp_access]
  return q
}

export function decodeAnswersFromQuery(q: Record<string, unknown>): Partial<AnchorAnswers> | null {
  if (!q.cl) return null
  const out: Partial<AnchorAnswers> = {
    paymentType: typeof q.pt === 'string' ? q.pt : null,
    incomeBand: typeof q.ib === 'string' ? q.ib : null,
    currentLga: q.cl ? Number(q.cl) : null,
    workLga: q.wl ? Number(q.wl) : null,
    weights: {
      schools: TIER_FROM_CODE[String(q.sc)] ?? 'somewhat',
      transport: TIER_FROM_CODE[String(q.tr)] ?? 'somewhat',
      gp_access: TIER_FROM_CODE[String(q.gp)] ?? 'somewhat'
    }
  }
  return out
}
