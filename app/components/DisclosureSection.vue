<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

/**
 * A section someone opens when they want it.
 *
 * Testers found the area page carried more than they wanted at once, so the parts that are not
 * the headline wait to be asked for. The heading stays visible and the control says "Show" in
 * words: the same testers walked straight past a tab strip, so nothing here depends on noticing
 * an icon.
 *
 * The content is not rendered while closed, so a chart inside one measures its width when it is
 * opened rather than reading zero behind a hidden parent.
 */
withDefaults(
  defineProps<{
    title: string
    /** Matches whatever the heading looked like before it became a control. */
    titleClass?: string
    /** For the one on a dark band, where the muted tone has no contrast. */
    toneClass?: string
  }>(),
  { titleClass: 'heading-section', toneClass: 'text-body' }
)

const open = ref(false)
// Has to be stable across the server render and the client one, or the button points at an id
// the panel never had.
const panelId = useId()
</script>

<template>
  <div>
    <h2 class="m-0" :class="titleClass">
      <button
        type="button"
        class="motion-colors w-full flex items-center justify-between gap-3 min-h-[52px] py-1 bg-transparent border-none text-left text-[inherit] font-[inherit] cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        :aria-expanded="open"
        :aria-controls="panelId"
        @click="open = !open"
      >
        <span>{{ title }}</span>
        <span class="shrink-0 inline-flex items-center gap-[6px] font-sans not-italic font-medium text-[15px]" :class="toneClass">
          {{ open ? 'Hide' : 'Show' }}
          <ChevronDown :size="20" :class="open ? 'rotate-180' : ''" aria-hidden="true" />
        </span>
      </button>
    </h2>
    <div v-if="open" :id="panelId" class="pt-1">
      <slot />
    </div>
  </div>
</template>
