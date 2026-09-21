<script setup lang="ts">
withDefaults(defineProps<{ text?: string }>(), {
  text: "This is a suggestion, not an answer. It's one input into your decision. The numbers can't know your job, your family or your support network."
})
</script>

<template>
  <div class="py-4 px-6 bg-banner-bg border-b border-banner-border font-sans text-[16px] leading-[1.5] text-banner-text">{{ text }}</div>
</template>
