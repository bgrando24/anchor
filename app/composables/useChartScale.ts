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
