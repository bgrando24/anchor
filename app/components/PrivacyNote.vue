<script setup lang="ts">
withDefaults(
  defineProps<{ title?: string; body?: string }>(),
  {
    title: 'Nothing you enter leaves your phone.',
    body: "No account, no sign-up, and we don't store any of this. All the working out happens on your device."
  }
)
</script>

<template>
  <div class="py-[18px] px-5 bg-surface-info rounded-md">
    <div class="font-sans font-semibold text-[17px] leading-[1.4] text-ink mb-[6px]">{{ title }}</div>
    <div class="font-sans text-[16px] leading-[1.5] text-body">{{ body }}</div>
  </div>
</template>
