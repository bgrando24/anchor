import { describe, expect, it } from 'vitest'
import { linearTrend } from '../app/composables/useChartScale'

const round = (values: number[] | null) => values?.map((v) => Math.round(v * 100) / 100) ?? null

describe('the fitted line', () => {
  it('lies on top of points that are already a straight line', () => {
    expect(round(linearTrend([10, 20, 30, 40]))).toEqual([10, 20, 30, 40])
  })

  // Symmetric about the middle, so there is genuinely no direction. An alternating run that
  // starts high and ends low does have one, which is what the first version of this test missed.
  it('runs flat through points with no direction', () => {
    expect(round(linearTrend([20, 25, 25, 20]))).toEqual([22.5, 22.5, 22.5, 22.5])
  })

  // Casey's six collections, which dip in the middle and come back up.
  it('smooths a dip rather than following it', () => {
    const fitted = linearTrend([25.9, 22, 22.5, 20.4, 19.7, 25.4])!
    expect(fitted[0]).toBeGreaterThan(fitted[fitted.length - 1]!)
    // A straight line, so every step is the same size. Measured on the raw values: rounding them
    // first makes neighbouring steps differ by a hundredth and says nothing about the fit.
    const steps = fitted.slice(1).map((v, i) => v - fitted[i]!)
    for (const step of steps) expect(step).toBeCloseTo(steps[0]!, 9)
  })

  it('has no line to draw through fewer than two points', () => {
    expect(linearTrend([])).toBeNull()
    expect(linearTrend([25])).toBeNull()
  })

  it('keeps the fitted values in step with the points it was given', () => {
    const values = [10, 14, 9, 18, 12, 20]
    expect(linearTrend(values)!.length).toBe(values.length)
  })
})
