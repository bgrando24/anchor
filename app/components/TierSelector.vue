<script setup lang="ts">
import { PRIORITY_TIERS, type PriorityTier } from '~/data/options'

defineProps<{ modelValue: PriorityTier; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [PriorityTier] }>()
</script>

<template>
  <div class="flex gap-2" role="radiogroup" :aria-label="label">
    <button
      v-for="t in PRIORITY_TIERS"
      :key="t.value"
      type="button"
      role="radio"
      :aria-checked="modelValue === t.value"
      class="flex-1 min-h-[52px] rounded-[10px] font-sans text-[16px] leading-[1.2] cursor-pointer"
      :class="
        modelValue === t.value
          ? 'border-2 border-accent bg-surface-accent-tint font-semibold text-ink'
          : 'border border-line-strong bg-surface-2 text-ink'
      "
      @click="emit('update:modelValue', t.value)"
    >
      {{ t.label }}
    </button>
  </div>
</template>
