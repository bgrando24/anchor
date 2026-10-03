import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

const VOID_TAGS = new Set(['br', 'img', 'input', 'hr', 'meta', 'link', 'source', 'area'])

/** The nodes at the top level of a template, with the branch directive each one carries. */
function rootNodes(text: string): { tag: string; branch: string | null; children: number }[] {
  const template = text.match(/<template>([\s\S]*)<\/template>/)
  if (!template) return []
  const body = template[1]!
  const roots: { tag: string; branch: string | null; children: number }[] = []
  let depth = 0
  let open: { tag: string; branch: string | null; children: number } | null = null
  for (const token of body.matchAll(/<(\/?)([A-Za-z][\w.-]*)([^>]*?)(\/?)>/g)) {
    const [, close, tag, attrs, selfClose] = token as unknown as string[]
    const isVoid = VOID_TAGS.has(tag!.toLowerCase()) || selfClose === '/'
    if (close) {
      depth -= 1
      if (depth === 0) open = null
    } else {
      if (depth === 0) {
        const branch = attrs!.match(/\bv-(if|else-if|else)\b/)?.[0] ?? null
        open = { tag: tag!, branch, children: 0 }
        roots.push(open)
      } else if (depth === 1 && open) {
        open.children += 1
      }
      if (!isVoid) depth += 1
    }
  }
  return roots
}

const PAGES = walk('app/pages')
  .filter((p) => p.endsWith('.vue'))
  .map((p) => ({ path: p, roots: rootNodes(readFileSync(p, 'utf8')) }))

describe('page roots', () => {
  it('finds the pages', () => {
    expect(PAGES.length).toBeGreaterThan(10)
  })

  // A page is wrapped in a transition, and a transition can only carry one element. A page with
  // several roots renders nothing at all when it is navigated away from, with no error anywhere:
  // that is how the area page went blank once the step transition was added.
  it('never leaves a page with more than one node to render', () => {
    for (const { path, roots } of PAGES) {
      if (roots.length <= 1) continue
      const branches = roots.map((r) => r.branch)
      expect(
        branches.every(Boolean),
        `${path} has ${roots.length} roots (${roots.map((r) => r.tag).join(', ')}) and they are not all v-if/v-else branches, so more than one can render at once`,
      ).toBe(true)
    }
  })

  // <template> at the root is a fragment: it is several nodes even when it carries a v-else.
  it('never roots a page on a bare template', () => {
    for (const { path, roots } of PAGES) {
      for (const root of roots) {
        expect(
          root.tag === 'template' && root.children > 1,
          `${path} roots on a <template> holding ${root.children} nodes, which is a fragment and cannot be transitioned`,
        ).toBe(false)
      }
    }
  })
})
