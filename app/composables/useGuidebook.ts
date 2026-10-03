import type { Lga } from './useLgaData'
import type { ScoredLga, SchoolFilter } from './useScoring'
import { schoolsMatching } from './useScoring'

/**
 * One plain line per scored factor, for the cards on an area's overview.
 *
 * These describe, they do not judge. "Five stations, more than most areas" is a fact about the
 * distribution; "five stations, fine for Melbourne" is an opinion about whether that is enough
 * for a particular household, which this product is in no position to hold. The reader knows
 * their own situation; our job is to tell them what is there and how it compares.
 *
 * Every line is built from the raw value, not from the 0-10 score, so the number on the card and
 * the sentence under it can never disagree.
 */

export interface Bands {
  /** Below the first quartile and above the third, per factor. */
  schools: [number, number]
  stations: [number, number]
}

function quartiles(values: number[]): [number, number] {
  const sorted = [...values].sort((a, b) => a - b)
  return [sorted[Math.floor(sorted.length / 4)]!, sorted[Math.floor((sorted.length * 3) / 4)]!]
}

export function bandsFrom(areas: Lga[]): Bands {
  return {
    schools: quartiles(areas.map((a) => a.school_count)),
    stations: quartiles(areas.map((a) => a.station_count))
  }
}

/** "more than most areas" / "fewer than most areas" / "about the middle for Victoria". */
function compare(value: number, [low, high]: [number, number], more: string, fewer: string): string {
  if (value > high) return more
  if (value < low) return fewer
  return 'about the middle for Victoria'
}

/**
 * GP visits as a share, in tens. Ten in ten reads as a rounding artefact rather than a fact, so
 * the top of the range says "almost all" instead, the same way the lettings label does.
 */
export function bulkBilledPhrase(rate: number): string {
  const pct = rate * 100
  if (pct >= 99.5) return 'Nearly every GP visit here is bulk-billed'
  if (pct >= 95) return 'Almost all GP visits here are bulk-billed'
  return `About ${Math.round(pct / 10)} in 10 GP visits here are bulk-billed`
}

export interface GuidebookContext {
  bands: Bands
  bedrooms: number
  /** The kinds of school the household asked about, when schools count for them. */
  schoolFilter?: SchoolFilter
}

export function rentLine(area: ScoredLga, ctx: GuidebookContext): string {
  // No published rent and no known income are different things. Treating them the same claimed
  // there was no rent for an area that has one and is ranked on it.
  if (area.rentPerWeek == null) {
    return `No typical rent is published for ${ctx.bedrooms}-bedroom homes here.`
  }
  if (area.rentSharePct == null) {
    return `$${area.rentPerWeek} a week for a ${ctx.bedrooms}-bedroom home.`
  }
  return `$${area.rentPerWeek} a week for a ${ctx.bedrooms}-bedroom home, which is ${area.rentSharePct}% of your income.`
}

export function schoolsLine(area: ScoredLga, ctx: GuidebookContext): string {
  const counted = schoolsMatching(area, ctx.schoolFilter)
  const kind = ctx.schoolFilter ? ' of the kinds you asked about' : ''
  if (counted === 0) return `No schools${kind} in this area.`
  if (counted === 1) return `One school${kind} in this area.`
  const how = compare(counted, ctx.bands.schools, 'more than most areas', 'fewer than most areas')
  return `${counted} schools${kind}, ${how}.`
}

export function transportLine(area: ScoredLga, ctx: GuidebookContext): string {
  if (area.station_count === 0) return 'No train station in this area.'
  if (area.station_count === 1) return 'One train station, so the timetable matters.'
  const how = compare(area.station_count, ctx.bands.stations, 'more than most areas', 'fewer than most areas')
  return `${area.station_count} train stations, ${how}.`
}

export function gpLine(area: ScoredLga): string {
  return `${bulkBilledPhrase(area.bulk_billing_rate)}.`
}

export interface GuidebookCard {
  key: 'rent' | 'schools' | 'transport' | 'gp_access'
  label: string
  /** 0-10, or null where there is no rent to rank. */
  score: number | null
  line: string
}

export function guidebookCards(area: ScoredLga, ctx: GuidebookContext): GuidebookCard[] {
  return [
    { key: 'rent', label: 'Rent', score: area.ranks.rent, line: rentLine(area, ctx) },
    { key: 'schools', label: 'Schools', score: area.ranks.schools, line: schoolsLine(area, ctx) },
    { key: 'transport', label: 'Train stations', score: area.ranks.transport, line: transportLine(area, ctx) },
    { key: 'gp_access', label: 'Bulk-billing doctors', score: area.ranks.gp_access, line: gpLine(area) }
  ]
}
