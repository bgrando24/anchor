<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

// The frame every question step shares: the progress bar on a phone, the step list beside the
// question on a wide screen. The question itself goes in the slot.
withDefaults(
  defineProps<{
    currentStep: number
    backTo?: string
    continueTo?: string
    continueLabel?: string
    continueReady?: boolean
  }>(),
  { backTo: undefined, continueTo: undefined, continueLabel: 'Continue', continueReady: true }
)
</script>

<template>
  <main class="page pt-5 pb-10 dt:grid dt:grid-cols-[300px_minmax(0,1fr)] dt:gap-10 dt:items-start">
    <!-- On a phone the bar is the whole sense of progress; from 860px the list takes over and
         stays in view while the question is answered. -->
    <div class="dt:hidden">
      <ProgressBar
        :current-step="currentStep"
        :back-to="backTo"
        :continue-to="continueTo"
        :continue-label="continueLabel"
        :continue-ready="continueReady"
      />
    </div>

    <div class="hidden dt:block dt:sticky dt:top-6">
      <StepList :current-step="currentStep" />
      <PrivacyNote class="mt-5">
        Your answers aren't sent anywhere. They're only used on this device.
      </PrivacyNote>
    </div>

    <div class="mt-5 dt:mt-0 flex flex-col gap-5 measure">
      <!-- The progress bar carries back and continue on a phone, and it is hidden here, so the
           wide layout needs its own pair or there is no way back from a question. -->
      <div v-if="backTo || continueTo" class="hidden dt:flex items-center gap-4">
        <NuxtLink
          v-if="backTo"
          :to="backTo"
          class="motion-colors inline-flex items-center gap-2 min-h-11 font-sans font-medium text-[15px] text-body no-underline hover:text-ink"
        >
          <ArrowLeft :size="18" aria-hidden="true" />
          Back
        </NuxtLink>
        <NuxtLink
          v-if="continueTo"
          :to="continueTo"
          class="btn-primary-sm ml-auto"
          :aria-disabled="!continueReady"
          :class="{ 'opacity-50 pointer-events-none': !continueReady }"
          @click="!continueReady && $event.preventDefault()"
        >
          {{ continueLabel }}
        </NuxtLink>
      </div>

      <slot />
    </div>
  </main>
</template>
