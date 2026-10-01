<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    currentStep: number
    total?: number
    backTo?: string
    /** Where this step continues to. Omit on a step that has no forward action. */
    continueTo?: string
    continueLabel?: string
    /** False greys it out and blocks it, matching the button at the foot of the page. */
    continueReady?: boolean
  }>(),
  {
    total: 4,
    backTo: undefined,
    continueTo: undefined,
    continueLabel: 'Continue',
    continueReady: true
  }
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-[10px]">
      <NuxtLink v-if="backTo" :to="backTo" class="icon-button -ml-3 text-body no-underline" aria-label="Back">
        <ArrowLeft :size="22" aria-hidden="true" />
      </NuxtLink>
      <div class="min-w-0 truncate font-mono font-medium text-[15px] leading-none text-muted">
        Step {{ currentStep }} of {{ total }}
      </div>
      <!-- The same action as the button at the foot of the page. The page can be taller than a
           phone screen, which left the only way forward below the fold. -->
      <NuxtLink
        v-if="continueTo"
        :to="continueTo"
        class="btn-primary-sm ml-auto shrink-0"
        :aria-disabled="!continueReady"
        :class="{ 'opacity-50 pointer-events-none': !continueReady }"
        @click="!continueReady && $event.preventDefault()"
      >
        {{ continueLabel }}
      </NuxtLink>
    </div>
    <div class="flex gap-[5px]" role="img" :aria-label="`Step ${currentStep} of ${total}`">
      <div
        v-for="i in total"
        :key="i"
        class="h-[5px] flex-1 rounded-[3px]"
        :class="i <= currentStep ? 'bg-accent' : 'bg-line'"
      />
    </div>
  </div>
</template>
