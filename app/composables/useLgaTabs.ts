import type { PriorityWeights, ScoringTier } from './useScoring'

/**
 * The tabs on an area's page, and the order they appear in.
 *
 * Order follows what the user said matters, so the tabs they came for are the ones in reach
 * without scrolling the strip. Overview and rent always lead: rent is half the score whatever
 * the user answered, so it is never buried.
 */

export type LgaTabKey = 'overview' | 'rent' | 'schools' | 'sport' | 'transport'

export interface LgaTab {
  key: LgaTabKey
  label: string
}

const LABELS: Record<LgaTabKey, string> = {
  overview: 'Overview',
  // "Rent", not "Affordability": it is the word the score row and the headline already use, and
  // the home page's "ranked by affordability" has already confused one reader.
  rent: 'Rent',
  schools: 'Schools',
  sport: 'Sport',
  transport: 'Transport'
}

const LEAD: LgaTabKey[] = ['overview', 'rent']

// "none" means the factor does not apply at all, so its tab goes behind even "not much".
const TIER_ORDER: Record<ScoringTier, number> = { a_lot: 0, somewhat: 1, not_much: 2, none: 3 }

/**
 * Sport has no weight of its own and sits in the middle on purpose: it is worth a look even
 * for a family whose kids play nothing, so it should not sink with the schools tab.
 *
 * When the questionnaire learns whether the user actually has school-age children, that answer
 * replaces the schools weight here and nothing else needs to change.
 */
function rankOf(key: LgaTabKey, weights?: PriorityWeights): number {
  if (!weights) return 1
  if (key === 'schools') return TIER_ORDER[weights.schools]
  if (key === 'transport') return TIER_ORDER[weights.transport]
  return 1
}

export function orderedLgaTabs(weights?: PriorityWeights): LgaTab[] {
  const rest: LgaTabKey[] = ['schools', 'sport', 'transport']
  const ordered = rest
    .map((key, index) => ({ key, rank: rankOf(key, weights), index }))
    // index keeps the sort stable, so equal ranks hold their declared order
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.key)
  return [...LEAD, ...ordered].map((key) => ({ key, label: LABELS[key] }))
}

export const LGA_TAB_KEYS = Object.keys(LABELS) as LgaTabKey[]
