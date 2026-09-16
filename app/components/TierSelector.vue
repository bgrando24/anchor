<script setup lang="ts">
import { PRIORITY_TIERS, type PriorityTier } from '~/data/options'

defineProps<{ modelValue: PriorityTier; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [PriorityTier] }>()
</script>

<template>
  <div class="tier-selector" role="radiogroup" :aria-label="label">
    <button
      v-for="t in PRIORITY_TIERS"
      :key="t.value"
      type="button"
      role="radio"
      :aria-checked="modelValue === t.value"
      class="tier-btn"
      :class="{ active: modelValue === t.value }"
      @click="emit('update:modelValue', t.value)"
    >
      {{ t.label }}
    </button>
  </div>
</template>

<style scoped>
.tier-selector {
  display: flex;
  gap: 8px;
}

.tier-btn {
  flex: 1;
  min-height: 52px;
  border: 1px solid var(--border-strong);
  background: var(--surface-2);
  border-radius: 10px;
  font: 400 16px/1.2 var(--font-sans);
  color: var(--ink);
  cursor: pointer;
}

.tier-btn.active {
  border: 2px solid var(--accent);
  background: var(--surface-accent-tint);
  font-weight: 600;
}
</style>
