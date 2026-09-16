<script setup lang="ts">
withDefaults(defineProps<{ text?: string }>(), {
  text: "This is a suggestion, not an answer. It's one input into your decision — the numbers can't know your job, your family or your support network."
})
</script>

<template>
  <div class="banner">{{ text }}</div>
</template>

<style scoped>
.banner {
  padding: 16px 24px;
  background: var(--banner-bg);
  border-bottom: 1px solid var(--banner-border);
  font: 400 16px/1.5 var(--font-sans);
  color: var(--banner-text);
}
</style>
