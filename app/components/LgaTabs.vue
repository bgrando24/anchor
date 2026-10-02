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

let observer: ResizeObserver | null = null
onMounted(() => {
  readEdges()
  if (strip.value) {
    observer = new ResizeObserver(readEdges)
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
    <div class="relative max-w-[960px] mx-auto">
      <!-- The fades are the only sign that the row runs past the edge, so they are the one part
           that must not be decorative: each shows only while there is more that way. -->
      <div
        v-show="!atStart"
        class="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-bg to-transparent"
        aria-hidden="true"
      />
      <div
        v-show="!atEnd"
        class="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-bg to-transparent"
        aria-hidden="true"
      />
      <div
        ref="strip"
        role="tablist"
        aria-label="More about this area"
        class="flex flex-nowrap overflow-x-auto px-4 dt:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        @scroll="readEdges"
      >
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
          class="shrink-0 min-h-11 px-4 border-b-2 bg-transparent font-sans text-[15px] leading-none cursor-pointer whitespace-nowrap"
          :class="
            tab.key === modelValue
              ? 'border-accent text-ink font-semibold'
              : 'border-transparent text-body font-medium hover:text-ink'
          "
          @click="select(tab.key)"
          @keydown="onKeydown($event, index)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>
  </div>
</template>
