<script setup lang="ts">
import { PRIORITY_TIERS, type PriorityTier } from '~/data/options'

// Native radios again, so the three chips are one tab stop and arrows move the choice (QA#19).
defineProps<{ modelValue: PriorityTier; label: string; name: string }>()
const emit = defineEmits<{ 'update:modelValue': [PriorityTier] }>()
</script>

<template>
  <fieldset class="m-0 p-0 border-0 min-w-0">
    <legend class="visually-hidden">{{ label }}</legend>
    <div class="flex gap-2">
      <label
        v-for="t in PRIORITY_TIERS"
        :key="t.value"
        class="flex-1 flex items-center justify-center min-h-[52px] px-2 rounded-[10px] font-sans text-[16px] leading-[1.2] text-center cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-focus-ring has-[:focus-visible]:outline-offset-2"
        :class="
          modelValue === t.value
            ? 'border-2 border-accent bg-surface-accent-tint font-semibold text-ink'
            : 'border border-line-focus bg-surface-2 text-ink'
        "
      >
        <input
          type="radio"
          :name="name"
          :value="t.value"
          :checked="modelValue === t.value"
          class="visually-hidden"
          @change="emit('update:modelValue', t.value)"
        />
        {{ t.label }}
      </label>
    </div>
  </fieldset>
</template>
