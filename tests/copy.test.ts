import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { lettingsLabel, ordinal, rowSentence, schoolOverlapNote, stationLabel, rankAreas } from '../app/composables/useScoring'
import type { PriorityWeights, SchoolFilter } from '../app/composables/useScoring'
import type { Lga } from '../app/composables/useLgaData'
import lgaFile from '../app/data/lgas.json'

const areas = (lgaFile as unknown as { lgas: Lga[] }).lgas

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

const TEMPLATES = ['app/pages', 'app/components', 'app/layouts']
  .flatMap((dir) => walk(dir))
  .filter((p) => p.endsWith('.vue'))
  .map((p) => ({ path: p, text: readFileSync(p, 'utf8') }))

describe('the old copy is gone', () => {
  const retired = [
    'This is a suggestion, not an answer',
    "you can't change it",
    "There's no right answer",
    "Close the tab and they're gone",
    'No account, no sign-up',
    'nothing personal in the link',
    'left out of the score',
    'Where do you work',
    '>Bars<'
  ]

  for (const phrase of retired) {
    it(`no template says "${phrase}"`, () => {
      expect(TEMPLATES.filter((f) => f.text.includes(phrase)).map((f) => f.path)).toEqual([])
    })
  }
})

describe('no glyph icons or HTML entities', () => {
  it('uses SVG icons instead of symbols and entities', () => {
    const offenders = TEMPLATES.filter((f) => /&#\d|&larr;|&times;|&hellip;|&middot;|[☀◑←×−—]/.test(f.text))
    expect(offenders.map((f) => f.path)).toEqual([])
  })
})

describe('sentences are plural-safe', () => {
  it('stationLabel', () => {
    expect(stationLabel(0)).toBe('No train stations')
    expect(stationLabel(1)).toBe('1 train station')
    expect(stationLabel(4)).toBe('4 train stations')
  })

  it('ordinal', () => {
    expect([1, 2, 3, 4, 9, 11, 12, 13, 21, 35, 79].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '9th', '11th', '12th', '13th', '21st', '35th', '79th'
    ])
  })

  it('lettingsLabel reads the extremes as words', () => {
    expect(lettingsLabel(0)).toBe('None')
    expect(lettingsLabel(100)).toBe('All')
    expect(lettingsLabel(96)).toBe('Almost all')
  })

  it('lettingsLabel counts low shares as "1 in n"', () => {
    expect(lettingsLabel(2.6)).toBe('About 1 in 38')
    expect(lettingsLabel(25)).toBe('About 1 in 4')
    expect(lettingsLabel(33.3)).toBe('About 1 in 3')
  })

  it('lettingsLabel counts high shares in tens, never as "1 in 1"', () => {
    // Every area above about two thirds used to read "About 1 in 1", which says all of them.
    expect(lettingsLabel(94.7)).toBe('About 9 in 10')
    expect(lettingsLabel(80)).toBe('About 8 in 10')
    expect(lettingsLabel(69)).toBe('About 7 in 10')
    expect(lettingsLabel(48.9)).toBe('About half')
  })

  it('lettingsLabel never claims all or none of a share that is neither', () => {
    // Stepped in whole tenths, because adding 0.1 repeatedly drifts past 100 and would
    // legitimately read "All".
    for (let tenths = 1; tenths < 1000; tenths++) {
      const label = lettingsLabel(tenths / 10)
      expect(label).not.toBe('About 1 in 1')
      expect(label).not.toBe('About 10 in 10')
      expect(label).not.toBe('About 0 in 10')
      expect(label).not.toBe('All')
      expect(label).not.toBe('None')
    }
  })
})

describe('row sentence', () => {
  const ranked = rankAreas(areas, {
    weeklyIncome: 1000,
    bedrooms: 2,
    weights: { schools: 'a_lot', transport: 'not_much', gp_access: 'not_much' }
  })

  it('says nothing when every priority is "Not much"', () => {
    const flat = rankAreas(areas, {
      weeklyIncome: 1000,
      bedrooms: 2,
      weights: { schools: 'not_much', transport: 'not_much', gp_access: 'not_much' }
    })
    expect(flat.every((r) => rowSentence(r, { schools: 'not_much', transport: 'not_much', gp_access: 'not_much' }) === null)).toBe(true)
  })

  it('only ever talks about a factor the user rated highest', () => {
    const weights = { schools: 'a_lot', transport: 'not_much', gp_access: 'not_much' } as const
    for (const r of ranked) {
      const sentence = rowSentence(r, weights)
      if (sentence) expect(sentence, r.lga_name).toMatch(/schools/)
    }
  })

  it('stays silent for the middle third', () => {
    const weights = { schools: 'a_lot', transport: 'not_much', gp_access: 'not_much' } as const
    const middle = ranked.filter((r) => r.ranks.schools > 10 / 3 && r.ranks.schools < 20 / 3)
    expect(middle.length).toBeGreaterThan(0)
    expect(middle.every((r) => rowSentence(r, weights) === null)).toBe(true)
  })

  it('never writes "1 train stations"', () => {
    const weights = { schools: 'not_much', transport: 'a_lot', gp_access: 'not_much' } as const
    for (const r of ranked) {
      const sentence = rowSentence(r, weights)
      if (sentence) expect(sentence, r.lga_name).not.toMatch(/\b1 train stations\b/)
    }
  })
})

describe('the results sentence when schools do not apply', () => {
  const ranked = (weights: PriorityWeights, schoolFilter?: SchoolFilter) =>
    rankAreas(areas, { weeklyIncome: 1000, bedrooms: 2, weights, schoolFilter })

  it('never mentions schools once they are weighted out', () => {
    const weights: PriorityWeights = { schools: 'none', transport: 'somewhat', gp_access: 'somewhat' }
    const scored = ranked(weights)
    for (const area of scored) {
      const sentence = rowSentence(area, weights)
      if (sentence) expect(sentence, area.lga_name).not.toMatch(/school/i)
    }
  })

  it('still finds something to say about the other factors', () => {
    const weights: PriorityWeights = { schools: 'none', transport: 'a_lot', gp_access: 'a_lot' }
    const said = ranked(weights)
      .map((area) => rowSentence(area, weights))
      .filter(Boolean)
    expect(said.length).toBeGreaterThan(0)
  })

  it('quotes the number of schools it actually ranked on, not every school', () => {
    const weights: PriorityWeights = { schools: 'a_lot', transport: 'not_much', gp_access: 'not_much' }
    const filter: SchoolFilter = { levels: ['primary'], sectors: ['catholic'] }
    const scored = ranked(weights, filter)
    // Find an area the sentence talks about schools for, and check the figure matches the filter.
    for (const area of scored) {
      const sentence = rowSentence(area, weights, filter)
      if (!sentence || !/school/i.test(sentence)) continue
      const quoted = Number(sentence.match(/\((\d+)\)/)?.[1])
      expect(quoted, area.lga_name).toBe(area.schools.primary.catholic)
      return
    }
    throw new Error('no area produced a schools sentence to check')
  })
})

describe('the site says one thing about how ranking works', () => {
  const text = (path: string) => TEMPLATES.find((t) => t.path === path)!.text

  it('tells the same story on the home page as on the results page', () => {
    // Paul read the home page as promising a ranking on rent alone, while the line under the
    // button promised four kinds of data. Both pages now describe rent first, then priorities.
    for (const path of ['app/pages/index.vue', 'app/pages/results/index.vue', 'app/pages/results/print.vue']) {
      expect(text(path), path).toMatch(/how much of your income the rent would take,?\s*\n?\s*then by what/)
    }
  })

  it('does not claim the results are based on four kinds of data equally', () => {
    expect(text('app/pages/index.vue')).not.toContain('Results are based on')
  })

  it('credits the data the pages now show', () => {
    const faq = text('app/pages/faq.vue')
    for (const source of ['Homes Victoria', 'Department of Education', 'Australian Early Development Census', 'Australian Bureau of Statistics']) {
      expect(faq, source).toContain(source)
    }
  })

  it('answers why the current area is asked for', () => {
    expect(text('app/pages/faq.vue')).toContain('Why do you ask where I live now?')
    expect(text('app/pages/location/index.vue')).toContain('/faq#current-area')
  })

  it('names the FAQ page the same way in the nav and on the page', () => {
    expect(text('app/components/AppHeader.vue')).toContain('FAQs')
    expect(text('app/pages/faq.vue')).toContain('>\n                FAQs')
  })
})

describe('copy mechanics', () => {
  it('never lowercases a sentence that starts with a month or a proper noun', () => {
    // meta.rentQuarter is "September quarter 2025"; lowercasing it printed "september".
    for (const { path, text } of TEMPLATES) {
      expect(text, path).not.toMatch(/rentQuarter\.toLowerCase\(\)/)
    }
  })

  it('asks about children, not the household, where it means children', () => {
    const schools = TEMPLATES.find((t) => t.path === 'app/pages/schools.vue')!.text
    expect(schools).toContain('Do you have children or dependants at school?')
  })

  it('avoids the words that read as filler', () => {
    const filler = [
      /\bseamless(ly)?\b/i,
      /\bdive in\b/i,
      /\bempower(s|ing)?\b/i,
      /\bunlock\b/i,
      /\belevate\b/i,
      /\bleverage\b/i,
      /\bgame.?chang(er|ing)\b/i,
      /\bcutting.edge\b/i,
      /\bwe've got you covered\b/i,
      /\bat your fingertips\b/i,
      /\bembark\b/i,
      /\bdelve\b/i
    ]
    for (const { path, text } of TEMPLATES) {
      for (const pattern of filler) {
        expect(text, `${path} matches ${pattern}`).not.toMatch(pattern)
      }
    }
  })

  it('writes in Australian English', () => {
    const american = [/\borganiz(e|ed|ing|ation)\b/i, /\bcenter\b/i, /\bcolor\b/i, /\bprioritiz/i, /\bneighborhood\b/i]
    for (const { path, text } of TEMPLATES) {
      // CSS property names are American by spec; only check prose, so skip style blocks.
      const prose = text.replace(/<style[\s\S]*?<\/style>/g, '').replace(/class="[^"]*"/g, '')
      for (const pattern of american) {
        expect(prose, `${path} matches ${pattern}`).not.toMatch(pattern)
      }
    }
  })
})

describe('hiding things from sight without moving the page', () => {
  it('never puts the hiding class straight on a table', () => {
    // CSS overflow does not apply to table boxes and a table will not shrink below its
    // min-content width, so a "hidden" table still lays out at full width and pushes the page
    // sideways. The hiding has to go on a wrapper the rule can actually clip.
    for (const { path, text } of TEMPLATES) {
      expect(text, `${path} hides a <table> directly`).not.toMatch(/<table[^>]*class="[^"]*visually-hidden/)
    }
  })

  it('keeps the chart data table reachable, just not visible', () => {
    const chart = TEMPLATES.find((t) => t.path.endsWith('AffordabilityChart.vue'))!.text
    expect(chart).toContain('<div class="visually-hidden">')
    expect(chart).toMatch(/<div class="visually-hidden">\s*<table>/)
    expect(chart).toContain('<caption>')
  })
})

describe('why the schools columns do not match the total', () => {
  it('says how many schools are counted twice, and what the columns really come to', () => {
    expect(schoolOverlapNote(7, 9)).toBe(
      '2 schools teach both levels, so they are counted in both columns. The columns add up to 9, not 7.'
    )
  })

  it('agrees with itself for a single school', () => {
    expect(schoolOverlapNote(17, 18)).toBe(
      '1 school teaches both levels, so it is counted in both columns. The columns add up to 18, not 17.'
    )
  })

  // 12 of the 79 areas have no school teaching both levels, and there the columns do add up to
  // the total. Claiming a discrepancy there would be the mistake this note exists to prevent.
  it('says nothing when the columns really do add up to the total', () => {
    expect(schoolOverlapNote(17, 17)).toBe('')
  })

  it('matches the published figures for every area', () => {
    for (const area of areas) {
      const columns = (['primary', 'secondary'] as const).reduce(
        (t, level) => t + area.schools[level].government + area.schools[level].catholic + area.schools[level].independent,
        0
      )
      const note = schoolOverlapNote(area.school_count, columns)
      if (columns === area.school_count) {
        expect(note, `${area.lga_name} claims a gap that is not there`).toBe('')
      } else {
        expect(note, `${area.lga_name} has no note for a real gap`).toContain(`add up to ${columns}, not ${area.school_count}`)
      }
    }
  })
})

describe('the trend sentence and the chart it sits above', () => {
  // Both ends of the sentence are a four-quarter mean, while the chart labels its first and last
  // quarter. Ballarat reads 45.0% against a 43.8% end point, which was reported as a bug. The
  // page has to say which is which.
  it('says the sentence averages a year, where the chart shows single quarters', () => {
    const page = TEMPLATES.find((t) => t.path.endsWith('results/[lga].vue'))!
    expect(page.text).toContain('Each point is one quarter.')
    expect(page.text, 'nothing explains why the sentence and the end points differ').toMatch(
      /averages a year at each end/
    )
  })
})

describe('the sections you open when you want them', () => {
  const source = TEMPLATES.find((t) => t.path.endsWith('DisclosureSection.vue'))!.text

  it('says "Show" in words, not only an icon', () => {
    // The same testers walked past a tab strip, so nothing here rests on noticing a chevron.
    expect(source).toContain("open ? 'Hide' : 'Show'")
  })

  it('tells assistive software what it opens, and what state it is in', () => {
    expect(source).toContain(':aria-expanded="open"')
    expect(source).toContain(':aria-controls="panelId"')
    expect(source).toContain(':id="panelId"')
  })

  // A random id differs between the server render and the client one, so the button ends up
  // pointing at an id the panel never had.
  it('uses an id that survives hydration', () => {
    expect(source).toContain('useId()')
    expect(source, 'a random id does not survive hydration').not.toMatch(/Math\.random/)
  })

  // v-if, not v-show: a chart inside a hidden parent measures its width as zero.
  it('leaves the contents out of the page until opened', () => {
    expect(source).toMatch(/<div v-if="open"/)
  })
})

describe('italic', () => {
  // Testers said there was too much of it. It now means one thing: the name of the area you are
  // looking at. A second italic class anywhere is the drift this guards against.
  it('is reserved for the area name and nothing else', () => {
    const css = readFileSync('app/assets/css/main.css', 'utf8')
    // Innermost rules only: a body that cannot contain a brace never swallows a nested rule, so
    // this does not match the @layer wrapper the way a looser pattern did.
    const italicRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((m) => /(^|[^-])\bitalic\b/.test(m[2]!))
      .map((m) => m[1]!.replace(/\/\*[\s\S]*?\*\//g, '').trim())
    expect(italicRules).toEqual(['.display-area'])
  })

  it('is not applied straight onto a template either', () => {
    for (const { path, text } of TEMPLATES) {
      // not-italic is the opposite, and is how a nested run of serif is set upright again.
      expect(text, `${path} sets italic in the markup`).not.toMatch(/class="[^"]*(?<!not-)\bitalic\b/)
    }
  })
})

describe('opening an area from the list', () => {
  const page = TEMPLATES.find((t) => t.path.endsWith('results/index.vue'))!.text

  // Testers aimed at the card and nothing happened, because only the name was a link.
  it('makes the whole row the link', () => {
    expect(page).toMatch(/<NuxtLink\s+:to="`\/results\/\$\{r\.lga_code\}`"/)
  })

  // A line above the list was not enough on its own: the next round of testing still asked for
  // something saying it on the row itself.
  it('says so on every row, not only once above the list', () => {
    expect(page, 'no per-row cue').toContain('Click to see more')
    expect(page, 'the line above the list went missing').toContain('Choose any area to see its')
  })

  it('never puts a link inside that link', () => {
    const row = page.slice(page.indexOf('v-for="r in group.rows"'), page.indexOf('</ol>'))
    const inner = row.slice(row.indexOf('<NuxtLink') + 1)
    expect(inner, 'a nested link makes the row invalid').not.toContain('<NuxtLink')
  })
})

describe('one column width for the page', () => {
  // The headline card and the tab strip were held to a width while the panels beneath them ran
  // the full screen, which put the two halves of the same page on different margins.
  it('gives the area page panels the same container as everything above them', () => {
    const page = TEMPLATES.find((t) => t.path.endsWith('results/[lga].vue'))!.text
    expect(page, 'a panel is setting its own padding instead of using the page column').not.toMatch(
      /class="[^"]*\bpx-4 dt:px-10/
    )
  })

  // Only containers wide enough to be the page itself. The narrower ones are reading columns
  // for prose and are meant to differ.
  it('spells the page width out in one place', () => {
    const css = readFileSync('app/assets/css/main.css', 'utf8')
    const cap = css.match(/\.page \{[\s\S]*?max-w-\[(\d+)px\]/)
    expect(cap, 'the page column has no width').not.toBeNull()
    for (const { path, text } of TEMPLATES) {
      for (const found of text.matchAll(/max-w-\[(\d+)px\] mx-auto/g)) {
        if (Number(found[1]) < 1000) continue
        expect(found[1], `${path} sets a page width of its own`).toBe(cap![1])
      }
    }
  })
})
