import { readFileSync, existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const TOKENS = readFileSync('app/assets/css/tokens.css', 'utf8')

interface Face { family: string; style: string; weight: string; file: string }

const FACES: Face[] = [...TOKENS.matchAll(/@font-face \{([\s\S]*?)\}/g)].map((m) => {
  const body = m[1]!
  return {
    family: body.match(/font-family:\s*'([^']+)'/)![1]!,
    style: body.match(/font-style:\s*(\w+)/)![1]!,
    weight: body.match(/font-weight:\s*([^;]+)/)![1]!.trim(),
    file: body.match(/url\('([^']+)'\)/)![1]!
  }
})

describe('the self-hosted faces', () => {
  it('finds them', () => {
    expect(FACES.length).toBeGreaterThanOrEqual(4)
  })

  // A family with only an italic face answers a request for normal with the italic one. Shipping
  // the serif italic alone set every serif heading in the app in italic, and no CSS said so:
  // getComputedStyle still reported "normal", because that is the value, not the face used.
  it('gives every family an upright face, not only an italic one', () => {
    const families = [...new Set(FACES.map((f) => f.family))]
    for (const family of families) {
      const styles = FACES.filter((f) => f.family === family).map((f) => f.style)
      expect(styles, `${family} has no upright face, so normal text renders in whatever it does have`).toContain(
        'normal'
      )
    }
  })

  it('ships the file each face points at', () => {
    for (const face of FACES) {
      expect(existsSync(`public${face.file}`), `${face.file} is declared but not in the repo`).toBe(true)
    }
  })

  it('serves them from this site, which is all the content policy allows', () => {
    for (const face of FACES) {
      expect(face.file, `${face.file} is not a local path`).toMatch(/^\/fonts\//)
    }
  })
})
