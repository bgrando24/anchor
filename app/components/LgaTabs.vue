<script setup lang="ts">
import type { LgaTab, LgaTabKey } from '~/composables/useLgaTabs'

/**
 * The tab strip on an area's page. Sticky, so it stays reachable however far down the panel
 * the reader is, and wrapping rather than scrolling sideways so no tab is ever off-screen.
 *
 * Built on the tabs pattern a screen reader expects: one tab stop for the whole strip, then
 * the arrow keys move between tabs.
 */
const props = defineProps<{ tabs: LgaTab[]; modelValue: LgaTabKey }>()
const emit = defineEmits<{ 'update:modelValue': [LgaTabKey] }>()

const buttons = ref<HTMLButtonElement[]>([])

function select(key: LgaTabKey) {
  emit('update:modelValue', key)
}

function focusTab(index: number) {
  const tab = props.tabs[index]
  if (!tab) return
  select(tab.key)
  // Follow the selection with focus, so the arrow keys keep working from the new tab.
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
  <div class="sticky top-0 z-10 bg-bg border-b border-line">
    <div
      role="tablist"
      aria-label="More about this area"
      class="max-w-[960px] mx-auto px-4 dt:px-10 flex flex-wrap gap-x-[6px] gap-y-1 py-2"
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
        class="min-h-11 px-3 rounded-md border-none bg-transparent font-sans font-medium text-[15px] leading-none cursor-pointer"
        :class="
          tab.key === modelValue
            ? 'bg-surface-2 text-ink font-semibold'
            : 'text-body hover:bg-[rgba(127,127,127,0.12)]'
        "
        @click="select(tab.key)"
        @keydown="onKeydown($event, index)"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>
