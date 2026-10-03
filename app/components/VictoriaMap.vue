<script setup lang="ts">
import outline from '~/data/victoria-outline.json'
import type { ScoredLga } from '~/composables/useScoring'

/**
 * Where the areas are, on the state.
 *
 * The list already says everything this does, in order and in words. What a picture adds is the
 * pattern: that the ones a household can afford sit together in one part of the state. So the
 * top of the ranking is drawn large and the rest faintly, rather than every area the same.
 *
 * The outline and the projection are worked out at build time, so there is nothing to compute
 * here and no map service to call: the shape is one path shipped with the page, which is what
 * keeps the content policy and the offline promise intact.
 */
const props = withDefaults(
  defineProps<{
    areas: ScoredLga[]
    /** How many off the top of the ranking to draw large. */
    topCount?: number
    currentLga?: number | null
  }>(),
  { topCount: 10, currentLga: null }
)

const { minLon, maxLat, scale, squash } = outline.projection
const at = (area: { lat: number; lon: number }) => ({
  x: Math.round((area.lon - minLon) * scale * 10) / 10,
  y: Math.round((maxLat - area.lat) * scale * squash * 10) / 10
})

const top = computed(() => props.areas.slice(0, props.topCount))
const rest = computed(() => props.areas.slice(props.topCount))
const current = computed(() =>
  props.currentLga == null ? null : (props.areas.find((a) => a.lga_code === props.currentLga) ?? null)
)

const label = computed(() => {
  const names = top.value.slice(0, 3).map((a) => a.lga_name)
  const where = names.length ? `${names.join(', ')} and others` : 'your areas'
  return `Map of Victoria. The ${props.topCount} areas ranked highest for you are marked, including ${where}.`
})
</script>

<template>
  <figure class="m-0">
    <svg
      :viewBox="`0 0 ${outline.width} ${outline.height}`"
      class="block w-full h-auto"
      role="img"
      :aria-label="label"
    >
      <path :d="outline.path" class="fill-surface-2 stroke-line" stroke-width="2" />

      <!-- Everything not in the top, so the shape of the state is populated and the highlights
           read as a selection out of it rather than as all there is. -->
      <circle v-for="a in rest" :key="a.lga_code" :cx="at(a).x" :cy="at(a).y" r="6" class="fill-line-strong" />

      <circle
        v-for="a in top"
        :key="a.lga_code"
        :cx="at(a).x"
        :cy="at(a).y"
        r="13"
        class="fill-accent"
      />

      <!-- Where they live now: a ring rather than another colour, so it is told apart by shape. -->
      <circle
        v-if="current"
        :cx="at(current).x"
        :cy="at(current).y"
        r="15"
        fill="none"
        class="stroke-ink"
        stroke-width="5"
      />
    </svg>
    <figcaption class="mt-2 font-sans text-[15px] leading-[1.45] text-muted">
      The {{ topCount }} areas ranked highest for you, marked on the state.<template v-if="current">
        The ring is {{ current.lga_name }}, where you live now.</template>
    </figcaption>
  </figure>
</template>
