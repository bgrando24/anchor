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
  <label
    class="flex items-center gap-[14px] min-h-[56px] bg-surface-2 border rounded-md font-sans text-[17px] leading-[1.35] text-ink cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-surface-info-text has-[:focus-visible]:outline-offset-2"
    :class="modelValue === value ? 'border-2 border-accent py-[9px] px-[17px] font-medium' : 'border-line-strong py-[10px] px-[18px]'"
  >
    <input
      type="radio"
      :name="name"
      :value="value"
      :checked="modelValue === value"
      class="visually-hidden"
      @change="emit('update:modelValue', value)"
    />
    <span
      class="w-[22px] h-[22px] rounded-full bg-surface-2 shrink-0"
      :class="modelValue === value ? 'border-[6px] border-accent' : 'border-2 border-line-focus'"
      aria-hidden="true"
    />
    <span class="flex flex-col gap-1">
      <span>{{ label }}</span>
      <span v-if="sublabel" class="font-mono text-[14px] leading-[1.3] text-muted">{{ sublabel }}</span>
    </span>
  </label>
</template>
