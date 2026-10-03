<script setup lang="ts">
import type { LgaTab, LgaTabKey } from '~/composables/useLgaTabs'

/**
 * The tab strip on an area's page. Sticky, and a single scrolling row: five tabs cannot fit on
 * one line at any phone width, and wrapping them left a ragged second row.
 *
 * Scrolling does hide tabs off the edge, which is the thing to be careful about here, so the
 * edges fade while there is more to see, choosing a tab brings it into view, and the arrow keys
 * still walk the whole strip.
 *
 * Built on the tabs pattern a screen reader expects: one tab stop for the strip, then the arrow
 * keys move between tabs.
 */
const props = defineProps<{ tabs: LgaTab[]; modelValue: LgaTabKey }>()
const emit = defineEmits<{ 'update:modelValue': [LgaTabKey] }>()

const strip = ref<HTMLElement | null>(null)
const buttons = ref<HTMLButtonElement[]>([])
const atStart = ref(true)
const atEnd = ref(true)

function readEdges() {
  const el = strip.value
  if (!el) return
  atStart.value = el.scrollLeft <= 1
  atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
}

/**
 * One bar slides between tabs rather than each tab drawing its own. It is measured from the
 * active button, so it has to wait for layout: until then the selected tab keeps a real bottom
 * border, which is what the prerendered HTML shows before any of this runs.
 */
const bar = ref({ x: 0, w: 0 })
const measured = ref(false)

function measureBar() {
  const index = props.tabs.findIndex((t) => t.key === props.modelValue)
  const el = buttons.value[index]
  if (!el) return
  bar.value = { x: el.offsetLeft, w: el.offsetWidth }
  measured.value = true
}

watch(() => props.modelValue, () => nextTick(measureBar))

let observer: ResizeObserver | null = null
onMounted(() => {
  readEdges()
  measureBar()
  // The tabs are set in a webfont, so their widths move once it loads.
  document.fonts?.ready.then(measureBar).catch(() => {})
  if (strip.value) {
    observer = new ResizeObserver(() => {
      readEdges()
      measureBar()
    })
    observer.observe(strip.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())

function select(key: LgaTabKey) {
  emit('update:modelValue', key)
  // A tab chosen from the keyboard can sit outside the visible part of the strip.
  nextTick(() => {
    const index = props.tabs.findIndex((t) => t.key === key)
    buttons.value[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    readEdges()
  })
}

function focusTab(index: number) {
  const tab = props.tabs[index]
  if (!tab) return
  select(tab.key)
  nextTick(() => buttons.value[index]?.focus())
}

function onKeydown(event: KeyboardEvent, index: number) {
  const last = props.tabs.length - 1
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault()
    focusTab(index === last ? 0 : index + 1)
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault()
    focusTab(index === 0 ? last : index - 1)
  } else if (event.key === 'Home') {
    event.preventDefault()
    focusTab(0)
  } else if (event.key === 'End') {
    event.preventDefault()
    focusTab(last)
  }
}
</script>

<template>
  <div class="sticky top-0 z-20 bg-bg border-b border-line">
    <div class="relative max-w-[1160px] mx-auto">
      <!-- The strip was missed entirely in testing, twice. It is the smallest type on a page
           where everything else is large, which is exactly what an older reader skips over, so
           it now matches the rest of the page and every label is at full contrast rather than
           the unselected ones being greyed. Which one is chosen is shown by the bar under it. -->
      <p class="m-0 pt-3 px-4 dt:px-10 font-sans font-medium text-[15px] uppercase tracking-[0.06em] text-muted">
        More about this area
      </p>
      <!-- The fades are the only sign that the row runs past the edge, so they are the one part
           that must not be decorative: each shows only while there is more that way. -->
      <div
        v-show="!atStart"
        class="pointer-events-none absolute left-0 bottom-0 h-[60px] w-8 z-10 bg-gradient-to-r from-bg to-transparent"
        aria-hidden="true"
      />
      <div
        v-show="!atEnd"
        class="pointer-events-none absolute right-0 bottom-0 h-[60px] w-8 z-10 bg-gradient-to-l from-bg to-transparent"
        aria-hidden="true"
      />
      <div
        ref="strip"
        role="tablist"
        aria-label="More about this area"
        class="relative flex flex-nowrap overflow-x-auto px-4 dt:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        @scroll="readEdges"
      >
        <!-- Inside the scrolling box, so it travels with the tabs rather than against them. -->
        <span
          v-show="measured"
          aria-hidden="true"
          class="tab-bar pointer-events-none absolute bottom-0 left-0 h-[3px] w-px origin-left bg-accent"
          :style="{ transform: `translateX(${bar.x}px) scaleX(${bar.w})` }"
        />
        <button
          v-for="(tab, index) in tabs"
          :key="tab.key"
          :ref="(el) => { if (el) buttons[index] = el as HTMLButtonElement }"
          type="button"
          role="tab"
          :id="`lga-tab-${tab.key}`"
          :aria-selected="tab.key === modelValue"
          :aria-controls="`lga-panel-${tab.key}`"
          :tabindex="tab.key === modelValue ? 0 : -1"
          class="motion-colors shrink-0 min-h-[60px] px-5 border-b-[3px] bg-transparent font-sans font-medium text-[20px] leading-none text-ink cursor-pointer whitespace-nowrap hover:bg-surface-2"
          :class="[tab.key === modelValue && !measured ? 'border-accent' : 'border-transparent']"
          @click="select(tab.key)"
          @keydown="onKeydown($event, index)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>
  </div>
</template>
