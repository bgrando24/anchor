<script setup lang="ts">

useHead({ title: "This link doesn't work" })

function startOver() {
  useAnchorState().reset()
  navigateTo('/')
}
</script>

<template>
  <main class="max-w-[480px] mx-auto px-4 dt:px-6 pt-10 pb-12 flex flex-col items-center text-center gap-3">
    <!-- The app's own mark with a gap broken out of its base: a roof that no longer sits on
         anything, which says "this link is broken" without a generic warning triangle. -->
    <svg
      width="72"
      height="72"
      viewBox="0 0 512 512"
      fill="none"
      stroke-width="44"
      stroke-linecap="round"
      class="mb-2"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M148 300 L256 192 L364 300" class="stroke-header-cta" />
      <line x1="160" y1="360" x2="228" y2="360" class="stroke-ink" />
      <line x1="284" y1="360" x2="352" y2="360" class="stroke-ink" />
    </svg>
    <h1 class="m-0 display-question">
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
