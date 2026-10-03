import { describe, expect, it } from 'vitest'
import { distanceKm, distanceLabel } from '../app/composables/useScoring'
import type { Lga } from '../app/composables/useLgaData'
import lgaFile from '../app/data/lgas.json'

const areas = (lgaFile as unknown as { lgas: Lga[] }).lgas
const find = (name: string) => areas.find((a) => a.lga_name === name)!

describe('how far apart two areas are', () => {
  it('gives every area a point inside Victoria', () => {
    for (const area of areas) {
      expect(area.lat, area.lga_name).toBeGreaterThan(-39.2)
      expect(area.lat, area.lga_name).toBeLessThan(-33.9)
      expect(area.lon, area.lga_name).toBeGreaterThan(140.9)
      expect(area.lon, area.lga_name).toBeLessThan(150.1)
    }
  })

  it('is nothing from an area to itself', () => {
    expect(distanceKm(find('Ballarat'), find('Ballarat'))).toBeCloseTo(0, 6)
  })

  it('does not care which way round it is asked', () => {
    const there = distanceKm(find('Mildura'), find('Latrobe'))
    const back = distanceKm(find('Latrobe'), find('Mildura'))
    expect(there).toBeCloseTo(back, 9)
  })

  // Checked against distances that are a matter of public record, allowing for these being
  // centres of whole councils rather than the towns people name.
  it('agrees with distances that are known', () => {
    const cases: [string, string, number][] = [
      ['Melbourne', 'Greater Bendigo', 130],
      ['Melbourne', 'Greater Geelong', 60],
      ['Melbourne', 'Latrobe', 140],
      ['Melbourne', 'Mildura', 450]
    ]
    for (const [from, to, expected] of cases) {
      const got = distanceKm(find(from), find(to))
      expect(Math.abs(got - expected), `${from} to ${to} came out at ${Math.round(got)}km`).toBeLessThan(
        expected * 0.25
      )
    }
  })

  it('puts neighbours close and opposite corners far apart', () => {
    expect(distanceKm(find('Bayside'), find('Glen Eira'))).toBeLessThan(15)
    expect(distanceKm(find('Mildura'), find('East Gippsland'))).toBeGreaterThan(500)
  })

  it('rounds to a precision the centres can carry', () => {
    expect(distanceLabel(0.4)).toBe('Same centre')
    expect(distanceLabel(7.2)).toBe('7 km away')
    expect(distanceLabel(43)).toBe('45 km away')
    expect(distanceLabel(112)).toBe('110 km away')
    expect(distanceLabel(447)).toBe('450 km away')
  })
})
