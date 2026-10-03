/** Rounded "nice" gridline values spanning a series, for the affordability chart's y-axis. */
export function niceScale(series: number[]): { lo: number; hi: number; ticks: number[] } {
  const min = Math.min(...series)
  const max = Math.max(...series)
  const span = Math.max(1, max - min)
  const step = [1, 2, 5, 10, 20, 25, 50].find((s) => span / s <= 2.2) ?? 50
  const lo = Math.max(0, Math.floor(min / step) * step)
  let hi = Math.ceil(max / step) * step
  if (hi <= lo) hi = lo + step
  return { lo, hi, ticks: [lo, (lo + hi) / 2, hi] }
}

/**
 * A straight line fitted through the points by least squares, as a value for each one.
 *
 * It answers a different question from the sentence beside it: that one compares the two most
 * recent collections, this one is the direction across the whole run. Fewer than two points have
 * no direction to show.
 */
export function linearTrend(values: number[]): number[] | null {
  const n = values.length
  if (n < 2) return null
  const meanX = (n - 1) / 2
  const meanY = values.reduce((sum, v) => sum + v, 0) / n
  let top = 0
  let bottom = 0
  for (let i = 0; i < n; i++) {
    top += (i - meanX) * (values[i]! - meanY)
    bottom += (i - meanX) ** 2
  }
  // Every x is distinct, so the denominator is only zero when there is nothing to fit.
  if (bottom === 0) return null
  const slope = top / bottom
  return values.map((_, i) => meanY + slope * (i - meanX))
}
