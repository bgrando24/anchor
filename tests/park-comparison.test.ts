import { describe, expect, it } from 'vitest'
import { parkComparison } from '../app/composables/useScoring'
import type { Lga } from '../app/composables/useLgaData'
import lgaFile from '../app/data/lgas.json'

const areas = (lgaFile as unknown as { lgas: Lga[] }).lgas
const find = (name: string) => areas.find((a) => a.lga_name === name)!

describe('park cover against the Greater Melbourne average', () => {
  it('uses the same benchmark for every area, as the report promises', () => {
    const benchmarks = new Set(areas.map((a) => parkComparison(a, areas)!.benchmark))
    expect(benchmarks.size).toBe(1)
    for (const area of areas) {
      expect(parkComparison(area, areas)!.sentence, area.lga_name).toContain(
        'average Greater Melbourne council area'
      )
    }
  })

  it('works the benchmark out from the Melbourne areas alone', () => {
    const melbourne = areas.filter((a) => a.area === 'Melbourne')
    const mean = melbourne.reduce((sum, a) => sum + a.green_space_pct, 0) / melbourne.length
    expect(parkComparison(find('Ballarat'), areas)!.benchmark).toBeCloseTo(Math.round(mean * 10) / 10, 5)
  })

  it('splits the Melbourne areas either side of it', () => {
    const melbourne = areas.filter((a) => a.area === 'Melbourne')
    const more = melbourne.filter((a) => parkComparison(a, areas)!.direction === 'more').length
    const less = melbourne.filter((a) => parkComparison(a, areas)!.direction === 'less').length
    expect(more).toBeGreaterThan(0)
    expect(less).toBeGreaterThan(0)
  })

  // Every regional council sits below the Greater Melbourne benchmark, which is mostly their land
  // area rather than their parks. That is the agreed comparison, so the sentence says why instead
  // of leaving it to read as nowhere for children to play.
  it('explains itself wherever the land area is doing the work', () => {
    const regional = areas.filter((a) => a.area === 'Regional Victoria')
    expect(regional.length).toBeGreaterThan(40)
    for (const area of regional) {
      expect(parkComparison(area, areas)!.sentence, area.lga_name).toContain(
        'cover much more land, so their parks are a smaller share of it'
      )
    }
  })

  it('leaves that explanation off the Melbourne areas, where it does not apply', () => {
    for (const area of areas.filter((a) => a.area === 'Melbourne')) {
      expect(parkComparison(area, areas)!.sentence, area.lga_name).not.toContain('cover much more land')
    }
  })

  it('says "about the same" rather than claiming a difference inside the band', () => {
    const peers = [
      { green_space_pct: 10, area: 'Melbourne' as const },
      { green_space_pct: 10, area: 'Melbourne' as const }
    ]
    expect(parkComparison({ green_space_pct: 10.5, area: 'Melbourne' }, peers)!.direction).toBe('about the same')
    expect(parkComparison({ green_space_pct: 12, area: 'Melbourne' }, peers)!.direction).toBe('more')
  })

  it('has no benchmark without any Melbourne areas to build one from', () => {
    expect(parkComparison({ green_space_pct: 5, area: 'Regional Victoria' }, [])).toBeNull()
  })

  it('writes a sentence for every area', () => {
    for (const area of areas) {
      expect(parkComparison(area, areas), area.lga_name).not.toBeNull()
    }
  })
})
