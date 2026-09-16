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
  <div class="privacy-note">
    <div class="title">{{ title }}</div>
    <div class="body">{{ body }}</div>
  </div>
</template>

<style scoped>
.privacy-note {
  padding: 18px 20px;
  background: var(--surface-info);
  border-radius: var(--radius-md);
}

.title {
  font: 600 17px/1.4 var(--font-sans);
  color: var(--ink);
  margin-bottom: 6px;
}

.body {
  font: 400 16px/1.5 var(--font-sans);
  color: var(--body);
}
</style>
