import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * The handoff's rule: whoever adds the first animation also adds the reduced-motion query. This
 * keeps that true for whoever adds the next one.
 */
const CSS = ['app/assets/css/main.css', 'app/assets/css/tokens.css']
  .map((path) => ({ path, text: readFileSync(path, 'utf8') }))

/** The media blocks that opt motion in, with their bodies. */
function motionBlocks(css: string): string[] {
  const out: string[] = []
  const re = /@media\s*\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)\s*\{/g
  let m: RegExpExecArray | null
  while ((m = re.exec(css))) {
    let depth = 1
    let i = m.index + m[0].length
    const start = i
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth++
      else if (css[i] === '}') depth--
      i++
    }
    out.push(css.slice(start, i - 1))
  }
  return out
}

describe('motion', () => {
  it('only animates for readers who have not asked it to stop', () => {
    for (const { path, text } of CSS) {
      const guarded = motionBlocks(text).join('\n')
      for (const match of text.matchAll(/transition:\s*([^;}]+)/g)) {
        const value = match[1]!.trim()
        // "transition: none" is the unguarded default that switches motion off.
        if (value === 'none') continue
        expect(guarded, `${path}: "${value}" is not inside a reduced-motion guard`).toContain(value)
      }
    }
  })

  it('keeps every duration short enough to feel like a response, not a show', () => {
    for (const { path, text } of CSS) {
      for (const block of motionBlocks(text)) {
        for (const match of block.matchAll(/(\d+)ms/g)) {
          expect(Number(match[1]), `${path}: ${match[0]}`).toBeLessThanOrEqual(160)
        }
      }
    }
  })

  it('never animates anything that would move text while it is being read', () => {
    for (const { path, text } of CSS) {
      for (const block of motionBlocks(text)) {
        for (const match of block.matchAll(/transition:\s*([^;}]+)/g)) {
          for (const property of ['height', 'width', 'margin', 'padding', 'top', 'left', 'font-size']) {
            expect(match[1], `${path} animates ${property}`).not.toMatch(new RegExp(`\\b${property}\\b`))
          }
        }
      }
    }
  })

  it('declares the no-motion default so the classes are inert without the query', () => {
    const main = CSS.find((c) => c.path.endsWith('main.css'))!.text
    expect(main).toMatch(/\.motion-colors,[\s\S]{0,80}\.motion-lift\s*\{\s*[\s\S]{0,120}transition:\s*none/)
  })
})

describe('the tab strip on an area page', () => {
  const source = readFileSync('app/components/LgaTabs.vue', 'utf8')

  // Missed by testers twice, so it is no longer the smallest type on the page.
  it('is set at the size of the rest of the page', () => {
    const size = source.match(/text-\[(\d+)px\][^"]*leading-none/)
    expect(size, 'the tab type size is not where it was').not.toBeNull()
    expect(Number(size![1])).toBeGreaterThanOrEqual(19)
  })

  // An older reader skips greyed text, so every label is at full contrast and the bar under the
  // strip is what says which one is chosen. Colour alone never carried it anyway.
  it('shows every label at full contrast, chosen or not', () => {
    expect(source, 'an unselected tab is greyed again').not.toMatch(/text-body['"\s]/)
    expect(source).toContain('text-ink')
  })

  it('still marks the chosen one for assistive software', () => {
    expect(source).toContain(':aria-selected="tab.key === modelValue"')
    expect(source).toContain('role="tab"')
  })
})
