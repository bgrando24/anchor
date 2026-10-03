import { PAYMENT_TYPES, INCOME_BANDS, PRIORITY_TIERS, SCHOOL_LEVELS, SCHOOL_SECTORS } from '~/data/options'
import type { SchoolLevel, SchoolSector } from '~/data/options'
import type { PriorityTier } from '~/data/options'
import type { Bedrooms, PriorityWeights, SchoolFilter } from './useScoring'
import { TIER_FROM_CODE, weightsCode } from './useScoring'
import { useLgaData } from './useLgaData'

/**
 * What the user picked on the priorities page. Never "none": whether schools apply is worked out
 * from the schools answers, not stored, so a shared link keeps the tier they chose either way.
 */
export interface AnchorWeights {
  schools: PriorityTier
  transport: PriorityTier
  gp_access: PriorityTier
}

/**
 * What the schools step asked. Each answer only matters once the one before it is given, so the
 * later fields stay empty until then.
 */
export interface SchoolAnswers {
  /** Any children currently at primary or high school. */
  hasKidsAtSchool: boolean | null
  levels: SchoolLevel[]
  sectors: SchoolSector[]
  /** Whether a move of schools is on the table. Schools only count if it is. */
  movingSchools: boolean | null
}

export interface AnchorAnswers {
  paymentType: string | null
  incomeBand: string | null
  bedrooms: Bedrooms | null
  currentLga: number | null
  schools: SchoolAnswers
  weights: AnchorWeights
}

export function defaultSchoolAnswers(): SchoolAnswers {
  return { hasKidsAtSchool: null, levels: [], sectors: [], movingSchools: null }
}

export function defaultAnswers(): AnchorAnswers {
  return {
    paymentType: null,
    incomeBand: null,
    bedrooms: null,
    currentLga: null,
    schools: defaultSchoolAnswers(),
    weights: { schools: 'somewhat', transport: 'somewhat', gp_access: 'somewhat' }
  }
}

/**
 * Schools change the ranking only for someone who has children at school AND is considering
 * moving them. Children who are staying put, or no children at all, means the areas' schools
 * make no difference to where this household could afford to live.
 */
export function schoolsCount(a: SchoolAnswers): boolean {
  return a.hasKidsAtSchool === true && a.movingSchools === true && a.levels.length > 0 && a.sectors.length > 0
}

/** The kinds of school this household is actually looking for, or undefined if schools don't count. */
export function schoolFilterFor(a: SchoolAnswers): SchoolFilter | undefined {
  if (a.levels.length === 0 || a.sectors.length === 0) return undefined
  return { levels: [...a.levels], sectors: [...a.sectors] }
}

/** True once the schools step has been answered far enough to move on. */
export function schoolsStepComplete(a: SchoolAnswers): boolean {
  if (a.hasKidsAtSchool === null) return false
  if (a.hasKidsAtSchool === false) return true
  // Children who would stay at their school need no further questions.
  if (a.movingSchools === false) return true
  if (a.movingSchools === null) return false
  return a.levels.length > 0 && a.sectors.length > 0
}

export function useAnchorState() {
  const answers = useState<AnchorAnswers>('anchor-answers', defaultAnswers)
  // Captured before anything renders, because by the time a prerendered page mounts the hash has
  // been cleared, and whether a link was opened decides whether kept progress may be used at all.
  const initialHash = useState<string>('anchor-initial-hash', () => '')
  const restored = useState<boolean>('anchor-restored', () => false)

  function reset() {
    answers.value = defaultAnswers()
  }

  /**
   * Puts back what this tab was part way through. Runs once, and only after the page has
   * hydrated: restoring before that would have the first render disagree with the prerendered
   * HTML, which Vue then has to patch back out.
   */
  function restore() {
    if (!import.meta.client || restored.value) return
    restored.value = true
    let saved: string | null = null
    try {
      saved = sessionStorage.getItem(SAVED_ANSWERS_KEY)
    } catch {
      // Blocked or unavailable: there is simply nothing to put back.
    }
    const next = answersToRestore(initialHash.value, saved)
    if (next) answers.value = next
  }

  const isComplete = computed(() => answersComplete(answers.value))

  return { answers, reset, isComplete, restore, initialHash }
}

export function answersComplete(a: AnchorAnswers): boolean {
  return a.paymentType != null && a.bedrooms != null && a.currentLga != null && schoolsStepComplete(a.schools)
}

/** Where a tab's own progress is kept, so a refresh does not start the questionnaire again. */
export const SAVED_ANSWERS_KEY = 'anchor-answers'

/**
 * What a tab keeps of its own progress.
 *
 * Not the link format: that one carries a finished set of answers, and its decoder rightly
 * refuses the half-filled state someone is in while they are still answering. Loosening it to
 * accept partial answers would weaken the check every real shared link gets.
 */
export function encodeSavedAnswers(a: AnchorAnswers): string {
  return JSON.stringify({
    paymentType: a.paymentType,
    incomeBand: a.incomeBand,
    bedrooms: a.bedrooms,
    currentLga: a.currentLga,
    schools: a.schools,
    weights: a.weights
  })
}

/**
 * Reads back what a tab kept, field by field.
 *
 * Anything unrecognised throws the whole lot away rather than restoring someone into a state
 * only half of which is understood: a stale shape left by an older build is exactly the case
 * where a partial restore would be worse than starting again.
 */
export function parseSavedAnswers(raw: string | null | undefined): AnchorAnswers | null {
  if (!raw) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
  const saved = parsed as Record<string, unknown>
  const next = defaultAnswers()

  if (saved.paymentType != null) {
    if (!PAYMENT_TYPES.some((p) => p.value === saved.paymentType)) return null
    next.paymentType = saved.paymentType as string
  }
  if (saved.incomeBand != null) {
    if (!INCOME_BANDS.some((b) => b.value === saved.incomeBand)) return null
    next.incomeBand = saved.incomeBand as string
  }
  if (saved.bedrooms != null) {
    if (saved.bedrooms !== 1 && saved.bedrooms !== 2 && saved.bedrooms !== 3) return null
    next.bedrooms = saved.bedrooms as Bedrooms
  }
  if (saved.currentLga != null) {
    if (typeof saved.currentLga !== 'number' || !useLgaData().byCode(saved.currentLga)) return null
    next.currentLga = saved.currentLga
  }

  if (saved.schools != null) {
    if (typeof saved.schools !== 'object' || Array.isArray(saved.schools)) return null
    const schools = saved.schools as Record<string, unknown>
    const levels = schools.levels ?? []
    const sectors = schools.sectors ?? []
    if (!Array.isArray(levels) || !levels.every((l) => SCHOOL_LEVELS.some((x) => x.value === l))) return null
    if (!Array.isArray(sectors) || !sectors.every((x) => SCHOOL_SECTORS.some((y) => y.value === x))) return null
    for (const key of ['hasKidsAtSchool', 'movingSchools'] as const) {
      if (schools[key] != null && typeof schools[key] !== 'boolean') return null
    }
    next.schools = {
      hasKidsAtSchool: (schools.hasKidsAtSchool ?? null) as boolean | null,
      movingSchools: (schools.movingSchools ?? null) as boolean | null,
      levels: levels as SchoolLevel[],
      sectors: sectors as SchoolSector[]
    }
  }

  if (saved.weights != null) {
    if (typeof saved.weights !== 'object' || Array.isArray(saved.weights)) return null
    const weights = saved.weights as Record<string, unknown>
    for (const key of ['schools', 'transport', 'gp_access'] as const) {
      const tier = weights[key]
      if (tier == null) continue
      if (!PRIORITY_TIERS.some((t) => t.value === tier)) return null
      next.weights[key] = tier as PriorityTier
    }
  }

  return next
}

/**
 * Which answers a page should open with.
 *
 * A link always wins. Opening someone else's link has to show that link's answers, not whatever
 * this tab was part way through, or the two would quietly mix.
 */
export function answersToRestore(hash: string | null | undefined, saved: string | null | undefined): AnchorAnswers | null {
  if (hash) return null
  return parseSavedAnswers(saved)
}

/** The first step the user still has to answer, used to bounce deep links back into the flow. */
export function firstUnansweredStep(a: AnchorAnswers): string | null {
  if (a.paymentType == null) return '/income'
  if (a.bedrooms == null) return '/bedrooms'
  if (a.currentLga == null) return '/location'
  if (!schoolsStepComplete(a.schools)) return '/schools'
  return null
}

// State lives in the URL fragment because browsers never send it to the server.
// v3 format: #3.<payment>.<income>.<bedrooms>.<currentLga>.<weights>.<schools>
//   e.g. #3.pps.200-500.2.27260.asa.ps-gc-y
// The schools segment is "n" for no children at school, "-" for not answered yet, otherwise
// <levels>-<sectors>-<moving>, so a shared link also carries the schools-tab filter.
// The version prefix makes older links fail loudly rather than decode into the wrong answers.
export const FRAGMENT_VERSION = '3'

const SCHOOLS_NOT_ANSWERED = '-'
const NO_KIDS_AT_SCHOOL = 'n'
// Inside the segment "-" separates the three parts, so "nothing chosen yet" needs its own mark.
// None of the level, sector or moving codes is a digit.
const NONE_CHOSEN = '0'

function codesFor<T extends string>(
  chosen: T[],
  options: { value: T; code: string }[]
): string {
  // Canonical order, so the same answers always produce the same link.
  const codes = options.filter((o) => chosen.includes(o.value)).map((o) => o.code)
  return codes.length ? codes.join('') : NONE_CHOSEN
}

function valuesFor<T extends string>(
  code: string,
  options: { value: T; code: string }[]
): T[] | null {
  if (code === NONE_CHOSEN) return []
  // An empty part is not something this app writes: nothing chosen is "0".
  if (code === '') return null
  const seen = new Set<string>()
  const values: T[] = []
  for (const char of code) {
    const option = options.find((o) => o.code === char)
    // Unknown, repeated or out-of-order codes mean the link was not built by this app.
    if (!option || seen.has(char)) return null
    seen.add(char)
    values.push(option.value)
  }
  const canonical = options.filter((o) => values.includes(o.value)).map((o) => o.code).join('')
  return canonical === code ? values : null
}

export function schoolsCode(a: SchoolAnswers): string {
  if (a.hasKidsAtSchool === null) return SCHOOLS_NOT_ANSWERED
  if (a.hasKidsAtSchool === false) return NO_KIDS_AT_SCHOOL
  const moving = a.movingSchools === null ? NONE_CHOSEN : a.movingSchools ? 'y' : 'n'
  return [codesFor(a.levels, SCHOOL_LEVELS), codesFor(a.sectors, SCHOOL_SECTORS), moving].join('-')
}

export function schoolsFromCode(code: string): SchoolAnswers | null {
  if (code === SCHOOLS_NOT_ANSWERED) return defaultSchoolAnswers()
  if (code === NO_KIDS_AT_SCHOOL) return { ...defaultSchoolAnswers(), hasKidsAtSchool: false }

  const parts = code.split('-')
  if (parts.length !== 3) return null
  const [levelCode, sectorCode, movingCode] = parts as [string, string, string]

  const levels = valuesFor(levelCode, SCHOOL_LEVELS)
  const sectors = valuesFor(sectorCode, SCHOOL_SECTORS)
  if (levels === null || sectors === null) return null
  if (movingCode !== 'y' && movingCode !== 'n' && movingCode !== NONE_CHOSEN) return null

  return {
    hasKidsAtSchool: true,
    levels,
    sectors,
    movingSchools: movingCode === NONE_CHOSEN ? null : movingCode === 'y'
  }
}

export function encodeAnswersToFragment(a: AnchorAnswers): string {
  const payment = PAYMENT_TYPES.find((p) => p.value === a.paymentType)?.code ?? '-'
  const income = INCOME_BANDS.find((b) => b.value === a.incomeBand)?.code ?? '-'
  const bedrooms = a.bedrooms != null ? String(a.bedrooms) : '-'
  const current = a.currentLga != null ? String(a.currentLga) : '-'
  return `#${[FRAGMENT_VERSION, payment, income, bedrooms, current, weightsCode(a.weights), schoolsCode(a.schools)].join('.')}`
}

/** Returns null for anything malformed, non-canonical, or naming an area that isn't in the data. */
export function decodeAnswersFromFragment(hash: string | null | undefined): AnchorAnswers | null {
  if (!hash) return null
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return null

  const parts = raw.split('.')
  if (parts.length !== 7) return null
  const [version, paymentCode, incomeCode, bedroomsCode, currentRaw, weights, schoolsRaw] = parts

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

  // Only the three tiers a person can choose; the scoring-only "none" is derived, never shared.
  if (!weights || !/^[nsa]{3}$/.test(weights)) return null
  const [sc, tr, gp] = weights.split('')

  if (schoolsRaw == null) return null
  const schools = schoolsFromCode(schoolsRaw)
  if (!schools) return null

  return {
    paymentType: payment.value,
    incomeBand,
    bedrooms,
    currentLga,
    schools,
    weights: {
      schools: TIER_FROM_CODE[sc!] as PriorityTier,
      transport: TIER_FROM_CODE[tr!] as PriorityTier,
      gp_access: TIER_FROM_CODE[gp!] as PriorityTier
    }
  }
}
