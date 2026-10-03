<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

/**
 * The frame around every question. It stays mounted while the question inside it changes, so
 * moving between steps fades only the question: the header, the progress bar and the step list
 * stay put, and the bar fills rather than being torn down and built again.
 */
const frame = useQuestionFrame()
</script>

<template>
  <div class="min-h-screen bg-bg">
    <OfflineBanner />
    <AppHeader variant="light" />
    <main class="page pt-5 pb-10 dt:grid dt:grid-cols-[300px_minmax(0,1fr)] dt:gap-10 dt:items-start">
      <!-- On a phone the bar is the whole sense of progress; from 860px the list takes over and
           stays in view while the question is answered. -->
      <div class="dt:hidden">
        <ProgressBar
          v-if="frame"
          :current-step="frame.currentStep"
          :back-to="frame.backTo"
          :continue-to="frame.continueTo"
          :continue-label="frame.continueLabel"
          :continue-ready="frame.continueReady"
        />
      </div>

      <!-- Offset so the question is the first thing down the page and this column reads as the
           record beside it. It still rises to the top once the page scrolls. -->
      <div class="hidden dt:block dt:mt-[116px] dt:sticky dt:top-6">
        <StepList v-if="frame" :current-step="frame.currentStep" />
        <PrivacyNote class="mt-5">
          Your answers aren't sent anywhere. They're only used on this device.
        </PrivacyNote>
      </div>

      <div class="mt-5 dt:mt-0 flex flex-col gap-5 measure">
        <!-- The progress bar carries back and continue on a phone, and it is hidden here, so the
             wide layout needs its own pair or there is no way back from a question. -->
        <div v-if="frame" class="hidden dt:flex items-center gap-4">
          <NuxtLink
            :to="frame.backTo"
            class="motion-colors inline-flex items-center gap-2 min-h-11 font-sans font-medium text-[15px] text-body no-underline hover:text-ink"
          >
            <ArrowLeft :size="18" aria-hidden="true" />
            Back
          </NuxtLink>
          <NuxtLink
            :to="frame.continueTo"
            class="btn-primary-sm ml-auto"
            :aria-disabled="!frame.continueReady"
            :class="{ 'opacity-50 pointer-events-none': !frame.continueReady }"
            @click="!frame.continueReady && $event.preventDefault()"
          >
            {{ frame.continueLabel }}
          </NuxtLink>
        </div>

        <slot />
      </div>
    </main>
  </div>
</template>
