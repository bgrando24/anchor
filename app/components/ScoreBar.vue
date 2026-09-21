<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: number
    sublabel: string
    tone?: 'affordability' | 'factor'
  }>(),
  { tone: 'factor' }
)
</script>

<template>
  <div class="flex flex-col">
    <div class="flex justify-between items-baseline mb-1">
      <span class="font-sans font-semibold text-[18px] leading-[1.3] text-ink">{{ label }}</span>
      <span class="font-mono font-medium text-[16px] leading-none text-ink">{{ value.toFixed(1) }} / 10</span>
    </div>
    <div class="font-sans text-[16px] leading-[1.4] text-body mb-[10px]">{{ sublabel }}</div>
    <div class="h-3 rounded-[6px] bg-line overflow-hidden">
      <div
        class="h-full rounded-[6px]"
        :class="tone === 'affordability' ? 'bg-data-affordability' : 'bg-data-main'"
        :style="{ width: Math.min(100, Math.max(0, (value / 10) * 100)) + '%' }"
      />
    </div>
  </div>
</template>
