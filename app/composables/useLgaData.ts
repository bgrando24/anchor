import file from '~/data/lgas.json'

export type AreaGroup = 'Melbourne' | 'Regional Victoria'

export interface LgaRent {
  flat_1br: number | null
  flat_2br: number | null
  house_2br: number | null
  house_3br: number | null
}

export interface SchoolSectors {
  government: number
  catholic: number
  independent: number
}

/**
 * Schools that teach both levels are counted on both sides, so primary and secondary
 * never add up to school_count. Show one side, or the total, never the sum.
 */
export interface LgaSchools {
  primary: SchoolSectors
  secondary: SchoolSectors
}

/**
 * The two ends of the affordable-share series and of its last five years, each averaged over a
 * year. Precomputed at build time so the page can state the trend without waiting for the
 * quarterly series file.
 */
export interface AffordabilityHistory {
  from: number
  from_year: string
  to: number
  to_year: string
  recent_from: number
  recent_year: string
  recent_years: number
}

/** One Australian Early Development Census round. Suppressed areas have no points at all. */
export interface AedcPoint {
  year: number
  vulnerable_pct: number
  valid_n: number | null
  vulnerable_n: number | null
}

export interface Lga {
  lga_code: number
  lga_name: string
  area: AreaGroup
  region: string
  school_count: number
  station_count: number
  bulk_billing_rate: number
  affordable_lettings_pct: number
  /** Change in the affordable share over the three years to the latest quarter. */
  affordability_trend_pp: number
  affordability_history: AffordabilityHistory
  seifa_irsd: number
  /** Parks as a share of the area's land. */
  green_space_pct: number
  schools: LgaSchools
  sport_variety: number
  /** Sport name to the number of facilities for it. */
  sports: Record<string, number>
  aedc: AedcPoint[] | null
  rent: LgaRent
  population: number | null
}

export interface LgaFileMeta {
  source: string
  generated: string
  rentQuarter: string
  /** The latest quarter in the affordability series, e.g. "Sep 2025". */
  affordabilityQuarter: string
}

const DATA = file as unknown as { meta: LgaFileMeta; lgas: Lga[] }
const LGAS = DATA.lgas

const byName = (a: Lga, b: Lga) => a.lga_name.localeCompare(b.lga_name)

// Regions in display order, derived from the data so the picker can never drift from it.
const REGION_ORDER: Record<AreaGroup, string[]> = {
  Melbourne: ['Inner Metro', 'Inner South East', 'Eastern', 'Northern', 'Southern', 'Western'],
  'Regional Victoria': ['Barwon South West', 'Gippsland', 'Grampians', 'Hume region', 'Loddon Mallee']
}

export const REGION_GROUPS: { area: AreaGroup; regions: string[] }[] = (
  Object.keys(REGION_ORDER) as AreaGroup[]
).map((area) => ({
  area,
  regions: REGION_ORDER[area].filter((r) => LGAS.some((l) => l.area === area && l.region === r))
}))

/**
 * "Hume region" already ends in the word, because the region and the City of Hume would
 * otherwise read alike. Appending to it gave "Hume region region".
 */
export function regionLabel(region: string): string {
  return /\bregions?$/i.test(region) ? region : `${region} region`
}

export function useLgaData() {
  const all = LGAS
  const meta = DATA.meta

  function byRegion(region: string) {
    return all.filter((l) => l.region === region).sort(byName)
  }

  function byCode(code: number | null | undefined) {
    if (code == null) return undefined
    return all.find((l) => l.lga_code === code)
  }

  function regionOf(code: number | null | undefined) {
    return byCode(code)?.region ?? null
  }

  function search(query: string) {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return all.filter((l) => l.lga_name.toLowerCase().includes(q)).sort(byName)
  }

  function regionCount(region: string) {
    return all.filter((l) => l.region === region).length
  }

  return { all, meta, byRegion, byCode, regionOf, search, regionCount }
}
