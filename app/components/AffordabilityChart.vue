<script setup lang="ts">
const props = defineProps<{ series: number[] }>()

const W = 320
const H = 132
const PAD_X = 8
const TOP_Y = 15
const BOTTOM_Y = 110

const bounds = computed(() => {
  const min = Math.min(...props.series)
  const max = Math.max(...props.series)
  const pad = Math.max(1, (max - min) * 0.15)
  return { min: Math.max(0, min - pad), max: max + pad }
})

function xFor(i: number) {
  return PAD_X + (i / (props.series.length - 1)) * (W - 2 * PAD_X)
}

function yFor(v: number) {
  const { min, max } = bounds.value
  const range = max - min || 1
  return BOTTOM_Y - ((v - min) / range) * (BOTTOM_Y - TOP_Y)
}

const points = computed(() =>
  props.series.map((v, i) => `${xFor(i).toFixed(1)},${yFor(v).toFixed(1)}`).join(' ')
)

const first = computed(() => props.series[0]!)
const last = computed(() => props.series[props.series.length - 1]!)
const trendWord = computed(() => {
  const diff = last.value - first.value
  if (Math.abs(diff) < 0.5) return 'stayed about the same'
  return diff < 0 ? 'fell' : 'rose'
})

const ariaLabel = computed(
  () =>
    `Line chart: affordable rentals ${trendWord.value} from ${first.value.toFixed(1)}% five years ago to ${last.value.toFixed(1)}% last quarter`
)
</script>

<template>
  <figure class="chart">
    <svg :viewBox="`0 0 ${W} ${H}`" class="chart-svg" role="img" :aria-label="ariaLabel">
      <line :x1="PAD_X" :y1="TOP_Y" :x2="W - PAD_X" :y2="TOP_Y" class="grid" />
      <line :x1="PAD_X" y1="72.2" :x2="W - PAD_X" y2="72.2" class="grid" />
      <line :x1="PAD_X" :y1="BOTTOM_Y" :x2="W - PAD_X" :y2="BOTTOM_Y" class="grid-strong" />
      <text :x="PAD_X" y="126" class="axis-text">5 years ago</text>
      <text :x="W - PAD_X" y="126" text-anchor="end" class="axis-text">Last quarter</text>
      <polyline :points="points" fill="none" class="line" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      <circle :cx="xFor(series.length - 1)" :cy="yFor(last)" r="4.5" class="dot" />
      <text :x="xFor(series.length - 1) - 6" y="99" text-anchor="end" class="end-label">{{ last.toFixed(1) }}%</text>
    </svg>
  </figure>
</template>

<style scoped>
.chart {
  margin: 0;
}

.chart-svg {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
}

.grid {
  stroke: var(--border-hairline);
  stroke-width: 1;
}

.grid-strong {
  stroke: var(--border-strong);
  stroke-width: 1;
}

.axis-text {
  fill: var(--muted);
  font: 400 11px var(--font-mono);
}

.line {
  stroke: var(--data-main);
}

.dot {
  fill: var(--data-main);
}

.end-label {
  fill: var(--ink);
  font: 600 13px var(--font-sans);
}
</style>
