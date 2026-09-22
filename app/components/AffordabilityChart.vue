<script setup lang="ts">
import { niceScale } from '~/composables/useChartScale'

// One series, no legend: the section title names it. The SVG is rendered at its real pixel
// width (a ResizeObserver sets the viewBox), so labels stay 13-14px at every size (QA#9).
const props = withDefaults(
  defineProps<{
    series: number[]
    /** Quarter labels, oldest first. Falls back to "5 years ago" / "Last quarter". */
    labels?: string[] | null
    title: string
  }>(),
  { labels: null }
)

const wrapper = ref<HTMLElement | null>(null)
const width = ref(560)
const H = 190
const PAD_L = 44
const PAD_R = 16
const TOP = 16
const BOTTOM = 148

let observer: ResizeObserver | null = null
onMounted(() => {
  if (!wrapper.value) return
  observer = new ResizeObserver((entries) => {
    const w = entries[0]?.contentRect.width
    if (w) width.value = Math.max(260, Math.round(w))
  })
  observer.observe(wrapper.value)
})
onBeforeUnmount(() => observer?.disconnect())

const plotWidth = computed(() => Math.max(60, width.value - PAD_L - PAD_R))

const scale = computed(() => niceScale(props.series))

function xFor(i: number) {
  const n = props.series.length
  return PAD_L + (n <= 1 ? plotWidth.value / 2 : (i / (n - 1)) * plotWidth.value)
}

function yFor(v: number) {
  const { lo, hi } = scale.value
  return BOTTOM - ((v - lo) / (hi - lo)) * (BOTTOM - TOP)
}

const points = computed(() => props.series.map((v, i) => `${xFor(i).toFixed(1)},${yFor(v).toFixed(1)}`).join(' '))

const first = computed(() => props.series[0]!)
const last = computed(() => props.series[props.series.length - 1]!)
const firstLabel = computed(() => props.labels?.[0] ?? '5 years ago')
const lastLabel = computed(() => props.labels?.[props.labels.length - 1] ?? 'Last quarter')

const trendWord = computed(() => {
  const diff = last.value - first.value
  if (Math.abs(diff) < 0.5) return 'stayed about the same'
  return diff < 0 ? 'fell' : 'rose'
})

// The same two numbers the caption compares (QA#32).
const ariaLabel = computed(
  () =>
    `Line chart. The share of new leases that were affordable ${trendWord.value} from ${first.value.toFixed(1)}% in ${firstLabel.value} to ${last.value.toFixed(1)}% in ${lastLabel.value}.`
)

const active = ref<number | null>(null)

function pointAt(clientX: number) {
  const box = wrapper.value?.getBoundingClientRect()
  if (!box) return
  const x = clientX - box.left
  const n = props.series.length
  const i = Math.round(((x - PAD_L) / plotWidth.value) * (n - 1))
  active.value = Math.min(n - 1, Math.max(0, i))
}

function quarterLabel(i: number) {
  return props.labels?.[i] ?? `Quarter ${i + 1}`
}
</script>

<template>
  <figure class="m-0">
    <div
      ref="wrapper"
      class="relative w-full"
      @mousemove="pointAt($event.clientX)"
      @mouseleave="active = null"
      @touchstart.passive="pointAt($event.touches[0]!.clientX)"
      @touchmove.passive="pointAt($event.touches[0]!.clientX)"
    >
      <svg :viewBox="`0 0 ${width} ${H}`" :width="width" :height="H" class="block max-w-full" role="img" :aria-label="ariaLabel">
        <g class="fill-muted font-mono text-[13px]">
          <template v-for="t in scale.ticks" :key="t">
            <line :x1="PAD_L" :y1="yFor(t)" :x2="width - PAD_R" :y2="yFor(t)" stroke-width="1" class="stroke-line-soft" />
            <text :x="PAD_L - 8" :y="yFor(t) + 4" text-anchor="end">{{ Math.round(t) }}%</text>
          </template>
        </g>

        <polyline :points="points" fill="none" class="stroke-data-main" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />

        <circle :cx="xFor(0)" :cy="yFor(first)" r="4" class="fill-data-main" />
        <circle :cx="xFor(series.length - 1)" :cy="yFor(last)" r="4" class="fill-data-main" />
        <text :x="xFor(0)" :y="yFor(first) - 10" text-anchor="start" class="fill-ink font-sans font-semibold text-[13px]">
          {{ first.toFixed(1) }}%
        </text>
        <text
          :x="xFor(series.length - 1)"
          :y="yFor(last) - 10"
          text-anchor="end"
          class="fill-ink font-sans font-semibold text-[13px]"
        >
          {{ last.toFixed(1) }}%
        </text>

        <text :x="PAD_L" :y="H - 6" class="fill-muted font-mono text-[13px]">{{ firstLabel }}</text>
        <text :x="width - PAD_R" :y="H - 6" text-anchor="end" class="fill-muted font-mono text-[13px]">
          {{ lastLabel }}
        </text>

        <g v-if="active != null">
          <line :x1="xFor(active)" :y1="TOP" :x2="xFor(active)" :y2="BOTTOM" stroke-width="1" class="stroke-line-strong" />
          <circle :cx="xFor(active)" :cy="yFor(series[active]!)" r="5" class="fill-data-main" />
        </g>
      </svg>

      <div
        v-if="active != null"
        class="absolute top-0 py-1 px-[10px] bg-surface-2 border border-line-strong rounded-[6px] font-mono text-[13px] leading-[1.4] text-ink pointer-events-none whitespace-nowrap"
        :style="{ left: `min(${xFor(active)}px, calc(100% - 140px))` }"
      >
        {{ quarterLabel(active) }}: {{ series[active]!.toFixed(1) }}%
      </div>
    </div>

    <table class="visually-hidden">
      <caption>{{ title }}</caption>
      <thead>
        <tr><th scope="col">Quarter</th><th scope="col">Share affordable</th></tr>
      </thead>
      <tbody>
        <tr v-for="(v, i) in series" :key="i">
          <th scope="row">{{ quarterLabel(i) }}</th>
          <td>{{ v.toFixed(1) }}%</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>
