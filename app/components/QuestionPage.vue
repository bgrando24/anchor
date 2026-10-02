<script setup lang="ts">
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
      <slot />
    </div>
  </main>
</template>
