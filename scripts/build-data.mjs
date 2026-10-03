// Builds app/data/lgas.json from the team's dataset plus the app-owned region lookup.
// Run by hand after new data lands; the output is committed:  node scripts/build-data.mjs
//
// Units, because the source mixes them: anything named *_pct here is a percentage out of 100,
// *_pp is a change in percentage points, and bulk_billing_rate stays the 0-1 share the source
// gives (the pages that show it multiply by 100). The source file states green space and AEDC
// as percentages already but affordability as a 0-1 share, so only the latter is scaled.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const SOURCE_DIR = resolve(here, '../app/data/source')
const TEAM_DIR = resolve(here, '../data_pipeline/iteration_2_data')
const OUT = resolve(here, '../app/data/lgas.json')
const SERIES = resolve(here, '../app/data/affordability-series.json')

const EXPECTED_ROWS = 79
const RENT_QUARTER = 'September quarter 2025'
const AEDC_YEARS = [2009, 2012, 2015, 2018, 2021, 2024]
const QUARTERS_PER_YEAR = 4
const RECENT_YEARS = 5
const SCHOOL_SECTORS = ['Government', 'Catholic', 'Independent']

// The council renamed itself in 2022; the source still carries the old name.
const NAME_FIXES = { Moreland: 'Merri-bek' }

const REQUIRED_NUMBERS = [
  'lga_code',
  'school_count',
  'station_count',
  'bulk_billing_rate',
  'affordability_pct',
  'affordability_trend',
  'seifa_irsd',
  'green_space_pct',
  'sport_variety'
]

function fail(message) {
  console.error(`build-data: ${message}`)
  process.exit(1)
}

/**
 * A point for each council, so a distance between two of them can be worked out.
 *
 * Area-weighted polygon centroids, which is a geometric centre rather than where anyone lives:
 * Mildura's sits about 48km from the township, out in the mallee. The wording that uses these
 * has to say centre to centre, and never imply a travelling distance.
 */
function readCoordinates(dir, name) {
  let text
  try {
    text = readFileSync(resolve(dir, name), 'utf8')
  } catch (error) {
    fail(`could not read ${name}: ${error.message}`)
  }
  const lines = text.trim().split(/\r?\n/)
  const header = lines[0].split(',').map((h) => h.trim())
  const want = ['lga_code', 'centroid_lat', 'centroid_lon']
  for (const column of want) {
    if (!header.includes(column)) fail(`${name} has no ${column} column`)
  }
  const points = new Map()
  for (const line of lines.slice(1)) {
    const cells = line.split(',')
    const row = Object.fromEntries(header.map((h, i) => [h, (cells[i] ?? '').trim()]))
    const lat = Number(row.centroid_lat)
    const lon = Number(row.centroid_lon)
    // Victoria, with a little room at the edges. A point outside it means the file is wrong.
    if (!Number.isFinite(lat) || lat < -39.2 || lat > -33.9) fail(`${name}: ${row.lga_code} has latitude ${row.centroid_lat}`)
    if (!Number.isFinite(lon) || lon < 140.9 || lon > 150.1) fail(`${name}: ${row.lga_code} has longitude ${row.centroid_lon}`)
    points.set(Number(row.lga_code), { lat, lon })
  }
  return points
}

/**
 * The state outline, turned into one SVG path at build time.
 *
 * Projected here rather than in the browser so the path ships as a few kilobytes of string and
 * the page has no projection to do. The same transform is written out beside it, because the
 * council points have to land on the same picture.
 *
 * Equirectangular, with longitude squashed by the cosine of the middle latitude. Victoria is
 * small enough that the error over its width is far under one pixel at the size this is drawn,
 * and anything fancier would need the projection repeated in the client.
 */
function readOutline(dir, name) {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(resolve(dir, name), 'utf8'))
  } catch (error) {
    fail(`could not read ${name}: ${error.message}`)
  }
  const geometry = parsed.geometry ?? parsed.features?.[0]?.geometry
  if (!geometry) fail(`${name} has no geometry`)
  const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()
  if (!rings.length) fail(`${name} has no rings`)

  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity
  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon)
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat)
    }
  }
  const WIDTH = 1000
  const squash = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
  const scale = WIDTH / (maxLon - minLon)
  const height = Math.round((maxLat - minLat) * scale * (1 / squash) * squash * 100) / 100
  const x = (lon) => ((lon - minLon) * scale).toFixed(1)
  const y = (lat) => ((maxLat - lat) * scale * squash).toFixed(1)

  const path = rings
    .map((ring) => `M${ring.map(([lon, lat]) => `${x(lon)},${y(lat)}`).join('L')}Z`)
    .join('')

  return {
    width: WIDTH,
    height: Math.round((maxLat - minLat) * scale * squash * 10) / 10,
    path,
    // What the page needs to put a point on this picture.
    projection: { minLon, maxLat, scale: Math.round(scale * 1000) / 1000, squash: Math.round(squash * 100000) / 100000 }
  }
}

function readJson(dir, name) {
  try {
    return JSON.parse(readFileSync(resolve(dir, name), 'utf8'))
  } catch (error) {
    fail(`could not read ${name}: ${error.message}`)
  }
}

const source = readJson(TEAM_DIR, 'master_data_v4.json')
const regionFile = readJson(SOURCE_DIR, 'regions.json')
const seriesFile = readJson(resolve(here, '../app/data'), 'affordability-series.json')

if (!Array.isArray(source)) fail('master_data_v4.json is not an array')
if (source.length !== EXPECTED_ROWS) fail(`expected ${EXPECTED_ROWS} rows, got ${source.length}`)

const regions = new Map()
for (const row of regionFile.regions) regions.set(row.lga_code, row)
if (regions.size !== EXPECTED_ROWS) fail(`regions.json has ${regions.size} unique codes, expected ${EXPECTED_ROWS}`)

const points = readCoordinates(SOURCE_DIR, 'lga_coordinates.csv')
if (points.size !== EXPECTED_ROWS) fail(`lga_coordinates.csv has ${points.size} areas, expected ${EXPECTED_ROWS}`)

const lastQuarter = seriesFile.quarters.at(-1)

const num = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null)
const round1 = (value) => Math.round(value * 10) / 10

function wholeOrNull(row, key) {
  const value = num(row[key])
  if (value === null) return null
  if (!Number.isInteger(value) || value < 0) fail(`${row.lga_name}: ${key} is ${row[key]}, expected a count`)
  return value
}

/**
 * The two ends of the whole series and of the last five years, each averaged across a year so a
 * single quarter cannot set the direction.
 *
 * Precomputed here rather than read off the series in the browser, because the page states the
 * trend in words above the fold and the series file is loaded on demand: deriving it at runtime
 * would reflow the heading once the file arrived. Only the chart itself needs the full series.
 * The wording, including what counts as no change, stays in the app so there is one rule for it.
 */
function affordabilityHistory(shares, quarters) {
  const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length
  const span = QUARTERS_PER_YEAR
  const recentStart = Math.max(0, Math.min(shares.length - span, shares.length - RECENT_YEARS * span))
  const year = (label) => label.split(' ')[1]
  return {
    from: round1(mean(shares.slice(0, span))),
    from_year: year(quarters[0]),
    to: round1(mean(shares.slice(-span))),
    to_year: year(quarters.at(-1)),
    recent_from: round1(mean(shares.slice(recentStart, recentStart + span))),
    recent_year: year(quarters[recentStart]),
    recent_years: RECENT_YEARS
  }
}

function schoolBreakdown(row) {
  const side = (prefix) => {
    const out = {}
    for (const sector of SCHOOL_SECTORS) {
      const key = `${prefix}_${sector}`
      const value = wholeOrNull(row, key)
      if (value === null) fail(`${row.lga_name}: ${key} is missing`)
      out[sector.toLowerCase()] = value
    }
    return out
  }
  // Schools teaching both levels are counted on both sides, so these never sum to school_count.
  return { primary: side('primary'), secondary: side('secondary') }
}

function aedc(row) {
  const points = []
  for (const year of AEDC_YEARS) {
    const pct = num(row[`aedc_vulnerable_pct_${year}`])
    if (pct === null) continue
    if (pct < 0 || pct > 100) fail(`${row.lga_name}: AEDC ${year} is ${pct}, expected a percentage`)
    points.push({
      year,
      vulnerable_pct: round1(pct),
      valid_n: wholeOrNull(row, `aedc_valid_n_${year}`),
      vulnerable_n: wholeOrNull(row, `aedc_vulnerable_n_${year}`)
    })
  }
  // One small borough is suppressed in every year; the page has to cope with no AEDC at all.
  return points.length ? points : null
}

function sports(row) {
  const value = row.sports
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${row.lga_name}: sports is ${JSON.stringify(value)}, expected an object`)
  }
  const out = {}
  for (const [name, count] of Object.entries(value)) {
    if (!Number.isInteger(count) || count < 0) fail(`${row.lga_name}: sports.${name} is ${count}, expected a count`)
    out[name] = count
  }
  return out
}

const seen = new Set()
const lgas = source.map((row) => {
  for (const key of REQUIRED_NUMBERS) {
    if (num(row[key]) === null) fail(`${row.lga_name ?? 'unknown area'}: ${key} is missing or not a number`)
  }
  if (seen.has(row.lga_code)) fail(`duplicate lga_code ${row.lga_code}`)
  seen.add(row.lga_code)

  const region = regions.get(row.lga_code)
  if (!region) fail(`lga_code ${row.lga_code} (${row.lga_name}) is missing from regions.json`)

  const point = points.get(row.lga_code)
  if (!point) fail(`lga_code ${row.lga_code} (${row.lga_name}) is missing from lga_coordinates.csv`)

  const name = NAME_FIXES[row.lga_name] ?? row.lga_name
  if (region.lga_name !== name && region.lga_name !== row.lga_name) {
    fail(`lga_code ${row.lga_code}: source calls it "${row.lga_name}", regions.json calls it "${region.lga_name}"`)
  }

  const block = seriesFile.series[String(row.lga_code)]
  if (!block) fail(`${name}: no affordability series; re-run scripts/extract-affordability-series.py`)
  const seriesLast = block.all.pct.at(-1) / 10
  if (Math.abs(seriesLast - row.affordability_pct * 100) > 0.05) {
    fail(
      `${name}: the series ends at ${seriesLast}% for ${lastQuarter} but affordability_pct is ` +
        `${round1(row.affordability_pct * 100)}%; the two sources disagree`
    )
  }

  const sportVariety = wholeOrNull(row, 'sport_variety')
  const sportsByName = sports(row)
  if (Object.keys(sportsByName).length !== sportVariety) {
    fail(`${name}: sport_variety is ${sportVariety} but sports lists ${Object.keys(sportsByName).length} sports`)
  }

  return {
    lga_code: row.lga_code,
    lga_name: name,
    area: region.area,
    region: region.region,
    school_count: row.school_count,
    station_count: row.station_count,
    bulk_billing_rate: row.bulk_billing_rate,
    affordable_lettings_pct: round1(row.affordability_pct * 100),
    affordability_trend_pp: round1(row.affordability_trend * 100),
    seifa_irsd: Math.round(row.seifa_irsd),
    green_space_pct: round1(row.green_space_pct),
    lat: point.lat,
    lon: point.lon,
    schools: schoolBreakdown(row),
    sport_variety: sportVariety,
    sports: sportsByName,
    aedc: aedc(row),
    affordability_history: affordabilityHistory(
      block.all.pct.map((tenths) => tenths / 10),
      seriesFile.quarters
    ),
    rent: {
      flat_1br: num(row.flat_1br_median),
      flat_2br: num(row.flat_2br_median),
      house_2br: num(row.house_2br_median),
      house_3br: num(row.house_3br_median)
    },
    // Not in the source yet; it would let schools and stations be ranked per 10,000 residents.
    population: num(row.population)
  }
})

lgas.sort((a, b) => a.lga_name.localeCompare(b.lga_name))

const file = {
  meta: {
    source: 'master_data_v4.json (data team) plus app-owned regions.json',
    generated: new Date().toISOString().slice(0, 10),
    rentQuarter: RENT_QUARTER,
    affordabilityQuarter: lastQuarter
  },
  lgas
}

writeFileSync(OUT, JSON.stringify(file, null, 2) + '\n')

const outline = readOutline(SOURCE_DIR, 'victoria_outline.geojson')
const OUTLINE_OUT = resolve(here, '../app/data/victoria-outline.json')
writeFileSync(OUTLINE_OUT, JSON.stringify(outline) + '\n')
console.log(
  `build-data: wrote the state outline (${(outline.path.length / 1024).toFixed(1)}kB of path) to app/data/victoria-outline.json`
)

const withRent = lgas.filter((l) => Object.values(l.rent).some((v) => v !== null)).length
const withAedc = lgas.filter((l) => l.aedc).length
console.log(
  `build-data: wrote ${lgas.length} areas to app/data/lgas.json ` +
    `(${withRent} with rent data, ${withAedc} with AEDC), checked against ${SERIES.split('/').at(-1)}`
)
