<script setup lang="ts">
import { CircleAlert } from 'lucide-vue-next'

useHead({ title: "This link doesn't work" })

function startOver() {
  useAnchorState().reset()
  navigateTo('/')
}
</script>

<template>
  <main class="max-w-[480px] mx-auto px-4 dt:px-6 pt-10 pb-12 flex flex-col items-center text-center gap-3">
    <div class="w-16 h-16 rounded-full bg-surface-info flex items-center justify-center mb-2 text-surface-info-text">
      <CircleAlert :size="30" aria-hidden="true" />
    </div>
    <h1 class="m-0 font-sans font-semibold text-[25px] leading-[1.3] text-ink tracking-[-0.01em]">
      This link doesn't work
    </h1>
    <p class="m-0 font-sans text-[17px] leading-[1.55] text-body max-w-[36ch]">
      It may be incomplete, or made with an older version of Anchor.
    </p>
    <button type="button" class="btn-primary w-full mt-4" @click="startOver">Start again</button>
    <p class="m-0 mt-2 font-sans text-[15px] leading-[1.5] text-muted">
      Results aren't saved anywhere, so you'll need to answer the questions again. It takes about two minutes.
    </p>
  </main>
</template>
