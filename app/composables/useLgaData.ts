import raw from '~/data/anchor-lgas.json'

export interface Lga {
  lga_code: number
  lga_name: string
  region: 'Metro Melbourne' | 'Regional Victoria'
  subregion: string
  population: number
  affordability_pct_latest: number
  affordability_pct_5yr_avg: number
  affordability_pct_5yr_stddev: number
  school_count: number
  train_station_count: number
  gp_bulk_billing_rate: number
  offence_rate_per_100k: number
  irsd_score: number
  irsd_decile: number
  open_space_count: number | null
  open_space_ha: number | null
  sports_facility_count: number | null
  affordability_series_5yr: number[]
}

const LGAS = (raw as { lgas: Lga[] }).lgas

/** Region groupings and display order, matching the two-step picker in the design. */
export const REGION_GROUPS: { region: string; subregions: string[] }[] = [
  { region: 'Melbourne', subregions: ['Inner', 'North & West', 'East', 'South'] },
  {
    region: 'Regional Victoria',
    subregions: ['Barwon South West', 'Grampians', 'Loddon Mallee', 'Hume', 'Gippsland']
  }
]

export function useLgaData() {
  const all = LGAS

  function bySubregion(subregion: string) {
    return all.filter((l) => l.subregion === subregion).sort((a, b) => a.lga_name.localeCompare(b.lga_name))
  }

  function byCode(code: number | null | undefined) {
    if (code == null) return undefined
    return all.find((l) => l.lga_code === code)
  }

  function search(query: string) {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return all.filter((l) => l.lga_name.toLowerCase().includes(q)).sort((a, b) => a.lga_name.localeCompare(b.lga_name))
  }

  function subregionCount(subregion: string) {
    return all.filter((l) => l.subregion === subregion).length
  }

  return { all, bySubregion, byCode, search, subregionCount }
}
