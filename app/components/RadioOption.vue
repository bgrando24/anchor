<script setup lang="ts">
defineProps<{
  modelValue: string | number | null
  value: string | number
  label: string
  sublabel?: string
  name: string
}>()

const emit = defineEmits<{ 'update:modelValue': [string | number] }>()
</script>

<template>
  <label class="radio-option" :class="{ selected: modelValue === value }">
    <input
      type="radio"
      :name="name"
      :value="value"
      :checked="modelValue === value"
      class="visually-hidden"
      @change="emit('update:modelValue', value)"
    />
    <span class="dot" aria-hidden="true" />
    <span class="text">
      <span class="label">{{ label }}</span>
      <span v-if="sublabel" class="sublabel">{{ sublabel }}</span>
    </span>
  </label>
</template>

<style scoped>
.radio-option {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 56px;
  padding: 10px 18px;
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  font: 400 17px/1.35 var(--font-sans);
  color: var(--ink);
  cursor: pointer;
}

.radio-option.selected {
  border: 2px solid var(--accent);
  padding: 9px 17px;
  font-weight: 500;
}

.radio-option:has(input:focus-visible) {
  outline: 3px solid var(--surface-info-text);
  outline-offset: 2px;
}

.dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--border-focus);
  background: var(--surface-2);
  flex-shrink: 0;
}

.radio-option.selected .dot {
  border: 6px solid var(--accent);
}

.text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sublabel {
  font: 400 14px/1.3 var(--font-mono);
  color: var(--muted);
}
</style>
