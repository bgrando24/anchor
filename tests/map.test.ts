import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import outline from '../app/data/victoria-outline.json'
import type { Lga } from '../app/composables/useLgaData'
import lgaFile from '../app/data/lgas.json'

const areas = (lgaFile as unknown as { lgas: Lga[] }).lgas

const at = (area: Pick<Lga, 'lat' | 'lon'>) => ({
  x: (area.lon - outline.projection.minLon) * outline.projection.scale,
  y: (outline.projection.maxLat - area.lat) * outline.projection.scale * outline.projection.squash
})

describe('the map of the state', () => {
  it('ships one path, small enough to send with the page', () => {
    expect(outline.path.startsWith('M')).toBe(true)
    expect(outline.path.length).toBeLessThan(40_000)
  })

  it('puts every area inside the picture', () => {
    for (const area of areas) {
      const { x, y } = at(area)
      expect(x, `${area.lga_name} x`).toBeGreaterThanOrEqual(0)
      expect(x, `${area.lga_name} x`).toBeLessThanOrEqual(outline.width)
      expect(y, `${area.lga_name} y`).toBeGreaterThanOrEqual(0)
      expect(y, `${area.lga_name} y`).toBeLessThanOrEqual(outline.height)
    }
  })

  // If the projection ever drifts from the one the path was drawn with, the dots slide off the
  // coastline and nothing else would catch it.
  it('keeps the places where they belong', () => {
    const where = (name: string) => at(areas.find((a) => a.lga_name === name)!)
    const melbourne = where('Melbourne')
    const mildura = where('Mildura')
    const eastGippsland = where('East Gippsland')
    expect(mildura.x).toBeLessThan(melbourne.x)
    expect(mildura.y).toBeLessThan(melbourne.y)
    expect(eastGippsland.x).toBeGreaterThan(melbourne.x)
    expect(melbourne.y / outline.height).toBeGreaterThan(0.6)
  })

  it('is drawn with no map service behind it', () => {
    const source = readFileSync('app/components/VictoriaMap.vue', 'utf8')
    expect(source).not.toMatch(/https?:\/\//)
    expect(source).toContain("import outline from '~/data/victoria-outline.json'")
  })

  it('tells assistive software what it is, and says the same in the caption', () => {
    const source = readFileSync('app/components/VictoriaMap.vue', 'utf8')
    expect(source).toContain('role="img"')
    expect(source).toContain(':aria-label="label"')
    expect(source).toContain('<figcaption')
  })

  // It showed all seventy-nine with the ranking marked, and nobody could tell which dot was
  // which. Two places need no labels, because the caption names both and there is nothing else
  // on the map to mistake them for.
  it('marks two places, not a crowd', () => {
    const source = readFileSync('app/components/VictoriaMap.vue', 'utf8')
    expect(source, 'it is drawing a list of areas again').not.toMatch(/v-for[^>]*circle|circle[^>]*v-for/)
    expect(source).toContain('area.lga_name')
    expect(source).toContain('current.lga_name')
  })

  // What matters is that the caption names both places and says which mark is which, not the
  // exact phrasing: the wording is copy and will be edited.
  it('names both of them in words, so the picture is not the only way to read it', () => {
    const source = readFileSync('app/components/VictoriaMap.vue', 'utf8')
    const caption = source.slice(source.indexOf('<figcaption'), source.indexOf('</figcaption>'))
    expect(caption, 'the caption does not name the area').toContain('area.lga_name')
    expect(caption, 'the caption does not name where they live now').toContain('current.lga_name')
    expect(caption, 'the caption does not say which mark is filled').toMatch(/filled/i)
    expect(caption, 'the caption does not say which mark is the ring').toMatch(/ring/i)
  })
})
