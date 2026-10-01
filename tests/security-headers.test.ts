import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * public/_headers is what Cloudflare Pages serves the site with. The policy has to permit
 * everything the app genuinely loads and nothing else, so adding a script from a CDN should
 * fail here rather than in a browser console after it ships.
 */
const HEADERS = readFileSync('public/_headers', 'utf8')

function headerValue(name: string): string {
  const line = HEADERS.split('\n').find((l) => l.trim().startsWith(`${name}:`))
  return line ? line.split(':').slice(1).join(':').trim() : ''
}

const CSP = Object.fromEntries(
  headerValue('Content-Security-Policy')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [directive, ...sources] = part.split(/\s+/)
      return [directive!, sources]
    })
)

function sourcesFor(directive: string): string[] {
  return CSP[directive] ?? CSP['default-src'] ?? []
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

const SOURCE = ['app', 'nuxt.config.ts'].flatMap((p) => (statSync(p).isDirectory() ? walk(p) : [p]))
  .filter((p) => /\.(vue|ts|css|json)$/.test(p))
  .map((p) => ({ path: p, text: readFileSync(p, 'utf8') }))

describe('the headers Cloudflare serves', () => {
  // The ones securityheaders.com grades on, which the site scored an F for having none of.
  const required = [
    'Content-Security-Policy',
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy'
  ]

  it.each(required)('sets %s', (name) => {
    expect(headerValue(name)).not.toBe('')
  })

  it('applies them to every path', () => {
    expect(HEADERS).toMatch(/^\/\*$/m)
  })

  it('tells browsers not to sniff types, and not to frame the site', () => {
    expect(headerValue('X-Content-Type-Options')).toBe('nosniff')
    expect(headerValue('X-Frame-Options')).toBe('DENY')
    expect(sourcesFor('frame-ancestors')).toEqual(["'none'"])
  })

  it('asks for HTTPS for a year', () => {
    const hsts = headerValue('Strict-Transport-Security')
    const maxAge = Number(hsts.match(/max-age=(\d+)/)?.[1])
    expect(maxAge).toBeGreaterThanOrEqual(31536000)
    // Not preloaded: that is a separate submission and far harder to undo.
    expect(hsts).not.toContain('preload')
  })

  it('leaves no referrer on a cross-origin request', () => {
    expect(headerValue('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  })

  it('turns off the device features the app never uses', () => {
    const policy = headerValue('Permissions-Policy')
    for (const feature of ['camera', 'microphone', 'geolocation', 'payment', 'usb']) {
      expect(policy, feature).toContain(`${feature}=()`)
    }
  })

  it('does not set an embedder policy, which would block the webfont', () => {
    // Cross-Origin-Embedder-Policy requires CORP headers on cross-origin resources, and Google
    // Fonts does not send them.
    expect(headerValue('Cross-Origin-Embedder-Policy')).toBe('')
  })
})

describe('the policy permits what the app actually loads', () => {
  it('falls back to self for anything not named', () => {
    expect(CSP['default-src']).toEqual(["'self'"])
  })

  it('allows the webfont stylesheet and its font files', () => {
    expect(sourcesFor('style-src')).toContain('https://fonts.googleapis.com')
    expect(sourcesFor('font-src')).toContain('https://fonts.gstatic.com')
  })

  it('allows the inline scripts the framework and the theme need', () => {
    // An import map, a hydration payload, and the pre-paint theme script. A static site has no
    // server to mint a nonce, and the payload differs per page so no fixed hash covers it.
    expect(sourcesFor('script-src')).toContain("'unsafe-inline'")
  })

  it('allows the inline widths the score bars are drawn with', () => {
    expect(sourcesFor('style-src')).toContain("'unsafe-inline'")
  })

  it('lets the service worker and the manifest load', () => {
    expect(sourcesFor('worker-src')).toContain("'self'")
    expect(sourcesFor('manifest-src')).toContain("'self'")
  })

  it('permits every external origin the source refers to', () => {
    const origins = new Set<string>()
    for (const file of SOURCE) {
      for (const match of file.text.matchAll(/https?:\/\/[a-z0-9.-]+/gi)) {
        origins.add(match[0].toLowerCase())
      }
    }
    // Everything the policy names anywhere, plus the documentation links that are only ever text.
    const allowed = new Set(Object.values(CSP).flat())
    const textOnly = new Set(['https://nuxt.com', 'https://www.servicesaustralia.gov.au'])
    for (const origin of origins) {
      if (textOnly.has(origin)) continue
      expect(allowed.has(origin), `${origin} is referenced but not allowed by the policy`).toBe(true)
    }
  })

  it('does not quietly allow a wildcard anywhere', () => {
    for (const [directive, sources] of Object.entries(CSP)) {
      for (const source of sources) {
        expect(source, `${directive} has a wildcard`).not.toBe('*')
        expect(source, `${directive} allows any https origin`).not.toBe('https:')
      }
    }
  })

  it('blocks plugins and stray base tags', () => {
    expect(sourcesFor('object-src')).toEqual(["'none'"])
    expect(sourcesFor('base-uri')).toEqual(["'self'"])
  })
})
