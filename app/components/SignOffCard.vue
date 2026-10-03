<script setup lang="ts">
// Closes a long page with the one thing the data cannot do. The mark is the only illustration
// the app uses, so it reads as a sign-off rather than decoration.
</script>

<template>
  <div
    class="flex items-start gap-4 p-5 dt:p-6 rounded-[18px] bg-surface-2 border border-line"
  >
    <LogoMark :size="34" class="mt-[2px] text-accent" />
    <p class="m-0 font-sans text-[16px] leading-[1.5] text-body">
      Rankings are based on public data. Please consider your own individual circumstances when
      making any decisions.
    </p>
  </div>
</template>
