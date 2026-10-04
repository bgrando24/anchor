<script setup lang="ts">
import outline from '~/data/victoria-outline.json'
import type { Lga } from '~/composables/useLgaData'

/**
 * Where this area is, against where the household lives now.
 *
 * It showed all seventy-nine at first, with the ranking marked. Nobody could tell which dot was
 * which, and a map you cannot read a name off is decoration. Two points answer a question
 * instead: this area, and the one you are comparing it with. No labels are needed because the
 * caption names both and there is nothing else on the map to confuse them with.
 *
 * The outline and the projection are worked out at build time, so there is nothing to compute
 * here and no map service to call: the shape is one path shipped with the page, which is what
 * keeps the content policy and the offline promise intact.
 */
const props = defineProps<{
  area: Pick<Lga, 'lat' | 'lon' | 'lga_name'>
  current?: Pick<Lga, 'lat' | 'lon' | 'lga_name'> | null
  /** Said in the caption, so the picture and the figure beside it agree. */
  distance?: string
}>()

const { theme } = useTheme();

const { minLon, maxLat, scale, squash } = outline.projection
const at = (place: { lat: number; lon: number }) => ({
  x: Math.round((place.lon - minLon) * scale * 10) / 10,
  y: Math.round((maxLat - place.lat) * scale * squash * 10) / 10
})

const label = computed(() =>
  props.current
    ? `Map of Victoria with two places marked: ${props.area.lga_name}, and ${props.current.lga_name} where you live now.`
    : `Map of Victoria with ${props.area.lga_name} marked.`
)
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

      <!-- Drawn before the area itself, so where you are going is never hidden behind where you
           are now when two councils sit close together. -->
      <circle
        v-if="current"
        :cx="at(current).x"
        :cy="at(current).y"
        r="15"
        fill="none"
        class="stroke-ink"
        stroke-width="6"
      />
      <circle :cx="at(area).x" :cy="at(area).y" r="16" class="fill-accent" />
    </svg>
    <!-- Held to a measure of its own: the map may be wide, a line of prose should not be. -->
    <figcaption class="mt-3 measure font-sans text-[16px] leading-[1.5] text-body">
      <span class="font-semibold text-ink">{{ area.lga_name }}</span> is approximately where the orange filled circle is<template
        v-if="current"
      >. The {{ theme === 'dark' ? "white" : "dark" }} ring is {{ current.lga_name }}, where you live now<template v-if="distance">, a distance of {{ distance }}</template></template>.
    </figcaption>
  </figure>
</template>
