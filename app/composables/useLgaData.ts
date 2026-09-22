import file from '~/data/lgas.json'

export type AreaGroup = 'Melbourne' | 'Regional Victoria'

export interface LgaRent {
  flat_1br: number | null
  flat_2br: number | null
  house_2br: number | null
  house_3br: number | null
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
  rent: LgaRent
  population: number | null
  lettings_series_5yr: number[] | null
}

export interface LgaFileMeta {
  source: string
  generated: string
  rentQuarter: string
  /** Quarter labels for lettings_series_5yr, oldest first. */
  lettingsQuarters: string[]
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
