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
  <figure class="m-0">
    <svg :viewBox="`0 0 ${W} ${H}`" class="w-full h-auto block overflow-visible" role="img" :aria-label="ariaLabel">
      <line :x1="PAD_X" :y1="TOP_Y" :x2="W - PAD_X" :y2="TOP_Y" stroke-width="1" class="stroke-line-soft" />
      <line :x1="PAD_X" y1="72.2" :x2="W - PAD_X" y2="72.2" stroke-width="1" class="stroke-line-soft" />
      <line :x1="PAD_X" :y1="BOTTOM_Y" :x2="W - PAD_X" :y2="BOTTOM_Y" stroke-width="1" class="stroke-line-strong" />
      <text :x="PAD_X" y="126" class="fill-muted font-mono text-[11px]">5 years ago</text>
      <text :x="W - PAD_X" y="126" text-anchor="end" class="fill-muted font-mono text-[11px]">Last quarter</text>
      <polyline :points="points" fill="none" class="stroke-data-main" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      <circle :cx="xFor(series.length - 1)" :cy="yFor(last)" r="4.5" class="fill-data-main" />
      <text :x="xFor(series.length - 1) - 6" y="99" text-anchor="end" class="fill-ink font-sans font-semibold text-[13px]">{{ last.toFixed(1) }}%</text>
    </svg>
  </figure>
</template>
