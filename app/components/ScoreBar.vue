<script setup lang="ts">
defineProps<{
  label: string
  /** 0-10 rank, or null when the area has no rent data. */
  value: number | null
  sublabel: string
}>()
</script>

<template>
  <div class="flex flex-col">
    <div class="flex justify-between items-baseline gap-3 mb-1">
      <span class="font-sans font-semibold text-[18px] leading-[1.3] text-ink">{{ label }}</span>
      <span class="font-mono font-medium text-[16px] leading-none text-ink shrink-0">
        {{ value == null ? 'No data' : `${value.toFixed(1)} / 10` }}
      </span>
    </div>
    <div class="font-sans text-[16px] leading-[1.4] text-body mb-[10px]">{{ sublabel }}</div>
    <div class="h-3 rounded-[6px] bg-line overflow-hidden">
      <div
        v-if="value != null"
        class="h-full rounded-[6px] bg-data-main"
        :style="{ width: Math.min(100, Math.max(0, (value / 10) * 100)) + '%' }"
      />
    </div>
  </div>
</template>
