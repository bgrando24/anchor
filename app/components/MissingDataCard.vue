<script setup lang="ts">
defineProps<{ label: string; note: string }>()
</script>

<template>
  <div class="missing-card">
    <div class="row">
      <span class="label">{{ label }}</span>
      <span class="value">No data</span>
    </div>
    <div class="note">{{ note }}</div>
  </div>
</template>

<style scoped>
.missing-card {
  padding: 16px 18px;
  background: var(--surface-missing);
  border: 1px dashed var(--border-missing);
  border-radius: var(--radius-md);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 4px;
}

.label {
  font: 600 18px/1.3 var(--font-sans);
  color: var(--muted-missing-heading);
}

.value {
  font: 500 15px/1 var(--font-mono);
  color: var(--muted-missing-heading);
  flex-shrink: 0;
}

.note {
  font: 400 16px/1.45 var(--font-sans);
  color: var(--muted-missing-body);
}
</style>
