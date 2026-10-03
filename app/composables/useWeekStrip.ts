/**
 * Rent as days of the week.
 *
 * A share of income is abstract; "rent uses about three days of your income" is not. The strip
 * draws seven bars and the sentences say the same thing in words, so the picture is never the
 * only way to get it.
 *
 * Only the share is needed. Deriving the weekly income back out of the rent and the share would
 * drift, because the share has already been rounded to a whole percent.
 */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

/** Below this the strip says "less than half a day" rather than naming a fraction. */
const NEGLIGIBLE_DAYS = 0.25
/** A part of a day this large reads as "almost all" of it. */
const ALMOST_ALL = 0.85
/** Below this a part of a day is not worth naming. */
const WORTH_NAMING = 0.15

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'] as const

/** "two", "two and a half", "half a day" — the quantity, without the unit. */
function halvesInWords(halves: number): string {
  const whole = Math.floor(halves / 2)
  const andAHalf = halves % 2 === 1
  if (whole === 0) return 'half'
  const word = WORDS[whole] ?? String(whole)
  return andAHalf ? `${word} and a half` : word
}

function unitFor(halves: number): string {
  return halves === 2 ? 'day' : 'days'
}

export interface WeekStrip {
  /** 0..1 per weekday, how much of that day's income goes on rent. */
  bars: { day: string; fill: number }[]
  headline: string
  body: string
  /** What a screen reader hears in place of the bars. */
  label: string
}

/**
 * Null when there is nothing to draw: no rent figure, or rent at or past the whole income, where
 * days of the week stop meaning anything.
 */
export function weekStrip(sharePct: number | null | undefined): WeekStrip | null {
  if (sharePct == null || !Number.isFinite(sharePct)) return null
  if (sharePct <= 0 || sharePct >= 100) return null

  const days = (sharePct / 100) * 7
  const bars = DAYS.map((day, i) => ({ day, fill: Math.min(1, Math.max(0, days - i)) }))

  // Nearest half day, then how far off that the real figure is.
  const halves = Math.round(days * 2)
  const nearest = halves / 2
  const drift = days - nearest
  let qualifier: string
  if (Math.abs(drift) <= 0.1) qualifier = 'about'
  else if (drift < 0) qualifier = 'almost'
  else qualifier = 'just over'

  const amount =
    days < NEGLIGIBLE_DAYS
      ? 'less than half a day'
      : `${qualifier} ${halvesInWords(halves)} ${unitFor(halves)}`

  const headline = `Rent uses ${amount} of your income each week.`

  const full = Math.floor(days)
  const part = days - full
  const named = DAYS.slice(0, full).map((day) => `all of ${day}'s`)
  if (part > ALMOST_ALL && full < DAYS.length) named.push(`almost all of ${DAYS[full]}'s`)
  else if (part >= WORTH_NAMING && full < DAYS.length) named.push(`part of ${DAYS[full]}'s`)
  if (named.length === 0) named.push(`part of ${DAYS[0]}'s`)

  const list =
    named.length > 1 ? `${named.slice(0, -1).join(', ')} and ${named[named.length - 1]}` : named[0]!

  return {
    bars,
    headline,
    body: `If your income came in evenly across the week, ${list} would go on rent.`,
    label: headline
  }
}

/** What the page says instead of the strip when rent would swallow the lot. */
export function overWholeIncomeNote(sharePct: number | null | undefined): string | null {
  if (sharePct == null || !Number.isFinite(sharePct) || sharePct < 100) return null
  return 'Rent would take more than your whole income.'
}
