<script setup lang="ts">
import { Lock } from 'lucide-vue-next'

// The one decorative icon in the app, used only here. Every note about what happens to a
// person's answers carries it, so the marker comes to mean that and nothing else.
defineProps<{ title?: string }>()
</script>

<template>
  <div class="flex items-start gap-3 py-[18px] px-5 bg-surface-info rounded-md">
    <Lock :size="21" class="mt-[2px] shrink-0 text-surface-info-text" aria-hidden="true" />
    <div class="min-w-0">
      <div v-if="title" class="font-sans font-semibold text-[17px] leading-[1.4] text-ink mb-[6px]">
        {{ title }}
      </div>
      <div class="font-sans text-[16px] leading-[1.5] text-body">
        <slot />
      </div>
    </div>
  </div>
</template>
