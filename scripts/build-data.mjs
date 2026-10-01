// Builds app/data/lgas.json from the team's dataset plus the app-owned region lookup.
// Run by hand after new data lands; the output is committed:  node scripts/build-data.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const SOURCE_DIR = resolve(here, '../app/data/source')
const OUT = resolve(here, '../app/data/lgas.json')

const EXPECTED_ROWS = 79
const RENT_QUARTER = 'September quarter 2025'

// The council renamed itself in 2022; the source still carries the old name.
const NAME_FIXES = { Moreland: 'Merri-bek' }

const REQUIRED_NUMBERS = ['lga_code', 'school_count', 'station_count', 'bulk_billing_rate', 'affordability_pct']

function fail(message) {
  console.error(`build-data: ${message}`)
  process.exit(1)
}

function readJson(name) {
  try {
    return JSON.parse(readFileSync(resolve(SOURCE_DIR, name), 'utf8'))
  } catch (error) {
    fail(`could not read ${name}: ${error.message}`)
  }
}

const source = readJson('master_data_v2.json')
const regionFile = readJson('regions.json')

if (!Array.isArray(source)) fail('master_data_v2.json is not an array')
if (source.length !== EXPECTED_ROWS) fail(`expected ${EXPECTED_ROWS} rows, got ${source.length}`)

const regions = new Map()
for (const row of regionFile.regions) regions.set(row.lga_code, row)
if (regions.size !== EXPECTED_ROWS) fail(`regions.json has ${regions.size} unique codes, expected ${EXPECTED_ROWS}`)

const seen = new Set()
const lgas = source.map((row) => {
  for (const key of REQUIRED_NUMBERS) {
    if (typeof row[key] !== 'number' || !Number.isFinite(row[key])) {
      fail(`${row.lga_name ?? 'unknown area'}: ${key} is missing or not a number`)
    }
  }
  if (seen.has(row.lga_code)) fail(`duplicate lga_code ${row.lga_code}`)
  seen.add(row.lga_code)

  const region = regions.get(row.lga_code)
  if (!region) fail(`lga_code ${row.lga_code} (${row.lga_name}) is missing from regions.json`)

  const name = NAME_FIXES[row.lga_name] ?? row.lga_name
  if (region.lga_name !== name && region.lga_name !== row.lga_name) {
    fail(`lga_code ${row.lga_code}: source calls it "${row.lga_name}", regions.json calls it "${region.lga_name}"`)
  }

  const rent = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null)

  return {
    lga_code: row.lga_code,
    lga_name: name,
    area: region.area,
    region: region.region,
    school_count: row.school_count,
    station_count: row.station_count,
    bulk_billing_rate: row.bulk_billing_rate,
    affordable_lettings_pct: Math.round(row.affordability_pct * 1000) / 10,
    rent: {
      flat_1br: rent(row.flat_1br_median),
      flat_2br: rent(row.flat_2br_median),
      house_2br: rent(row.house_2br_median),
      house_3br: rent(row.house_3br_median)
    },
    // Not in v2 yet. population unlocks per-10,000 ranking; the series unlocks the chart.
    population: rent(row.population),
    lettings_series_5yr: Array.isArray(row.lettings_series_5yr) ? row.lettings_series_5yr : null
  }
})

lgas.sort((a, b) => a.lga_name.localeCompare(b.lga_name))

const file = {
  meta: {
    source: 'master_data_v2.json (data team) plus app-owned regions.json',
    generated: new Date().toISOString().slice(0, 10),
    rentQuarter: RENT_QUARTER
  },
  lgas
}

writeFileSync(OUT, JSON.stringify(file, null, 2) + '\n')
const withRent = lgas.filter((l) => Object.values(l.rent).some((v) => v !== null)).length
console.log(`build-data: wrote ${lgas.length} areas to app/data/lgas.json (${withRent} with rent data)`)
