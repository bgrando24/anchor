/**
 * Measures what this site actually costs to download.
 *
 * Run it after a build:
 *
 *   npm ci && npm run build && node scripts/measure-build.mjs
 *
 * Every figure comes from the files in .output/public, so anyone can clone the repository and
 * get the same answer. Nothing here is written down by hand.
 *
 * "Over the wire" is the brotli-compressed size, which is what a browser receives: Cloudflare
 * compresses text as it serves it. Fonts and images are already compressed formats and are
 * counted at their real size, because compressing them again saves nothing.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { brotliCompressSync, constants } from 'node:zlib'

const ROOT = '.output/public'

try {
  statSync(ROOT)
} catch {
  console.error(`No build found at ${ROOT}. Run "npm run build" first.`)
  process.exit(1)
}

const brotli = (buffer) =>
  brotliCompressSync(buffer, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length

/** Formats that a server compresses on the way out. The rest are already compressed. */
const COMPRESSED_IN_TRANSIT = new Set(['.html', '.js', '.css', '.json', '.svg', '.webmanifest', '.txt', '.xml'])

function everyFile(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? everyFile(join(dir, entry.name)) : [join(dir, entry.name)]
  )
}

function group(file) {
  const ext = extname(file)
  if (ext === '.html') return 'HTML pages'
  if (ext === '.js') return 'JavaScript (code and data)'
  if (ext === '.css') return 'CSS'
  if (ext === '.woff2') return 'fonts'
  if (['.png', '.jpg', '.jpeg', '.ico', '.svg'].includes(ext)) return 'images and icons'
  if (ext === '.json') return 'payload JSON'
  return 'other'
}

const files = everyFile(ROOT)
const totals = new Map()
let onDisk = 0
let overTheWire = 0

for (const file of files) {
  const bytes = readFileSync(file)
  const sent = COMPRESSED_IN_TRANSIT.has(extname(file)) ? brotli(bytes) : bytes.length
  const key = group(file)
  const row = totals.get(key) ?? { files: 0, disk: 0, sent: 0 }
  row.files += 1
  row.disk += bytes.length
  row.sent += sent
  totals.set(key, row)
  onDisk += bytes.length
  overTheWire += sent
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`.padStart(10)
const mb = (n) => `${(n / 1048576).toFixed(2)} MB`

console.log('\nThe whole deployed site\n')
console.log('  ' + 'Type'.padEnd(30) + 'Count'.padStart(6) + 'On Disk'.padStart(10) + 'Compressed'.padStart(14))
console.log('  ' + '-'.repeat(62))
for (const [name, row] of [...totals].sort((a, b) => b[1].sent - a[1].sent)) {
  console.log('  ' + name.padEnd(30) + String(row.files).padStart(6) + kb(row.disk) + kb(row.sent))
}
console.log('  ' + '-'.repeat(62))
console.log('  ' + 'TOTAL'.padEnd(30) + String(files.length).padStart(6) + kb(onDisk) + kb(overTheWire))
console.log(`\n  ${mb(onDisk)} on disk, ${mb(overTheWire)} transferred\n`)

// The three datasets, found by what only the data contains rather than by filename, because the
// filenames carry a content hash that changes on every build.
const chunks = files.filter((f) => f.endsWith('.js'))
const find = (test) => chunks.find((f) => test(readFileSync(f, 'utf8')))
const datasets = [
  ['all 79 council areas', find((s) => (s.match(/lga_name:/g) ?? []).length > 50)],
  ['affordability series, 2000 to 2025', find((s) => s.includes('quarters') && /Mar 2000/.test(s))],
  ['outline of Victoria', find((s) => s.includes('minLon') && s.includes('projection'))]
]

console.log('The datasets inside that JavaScript\n')
let dataDisk = 0
let dataSent = 0
for (const [name, file] of datasets) {
  if (!file) {
    console.log('  ' + name.padEnd(38) + 'not found')
    continue
  }
  const bytes = readFileSync(file)
  dataDisk += bytes.length
  dataSent += brotli(bytes)
  console.log('  ' + name.padEnd(38) + kb(bytes.length) + kb(brotli(bytes)))
}
console.log('  ' + '-'.repeat(62))
console.log('  ' + 'all data'.padEnd(38) + kb(dataDisk) + kb(dataSent))

// What a device keeps so the site works with no connection.
const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8')
const precached = [...sw.matchAll(/url:"([^"]+)"/g)].map((m) => decodeURIComponent(m[1]))
let cacheDisk = 0
let cacheSent = 0
let unresolved = 0
for (const url of precached) {
  let path = join(ROOT, url)
  try {
    if (statSync(path).isDirectory()) path = join(path, 'index.html')
  } catch {
    path = join(ROOT, url, 'index.html')
  }
  try {
    const bytes = readFileSync(path)
    cacheDisk += bytes.length
    cacheSent += COMPRESSED_IN_TRANSIT.has(extname(path)) ? brotli(bytes) : bytes.length
  } catch {
    unresolved += 1
  }
}
console.log(`\nStored on the device for offline use\n`)
console.log(`  ${precached.length} files${unresolved ? ` (${unresolved} unresolved)` : ''}`)
console.log(`  ${mb(cacheDisk)} stored, ${mb(cacheSent)} downloaded once\n`)
