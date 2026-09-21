<script setup lang="ts">
defineProps<{
  weights: { affordability: number; schools: number; transport: number; gp_access: number }
}>()
</script>

<template>
  <div class="py-[18px] px-5 bg-surface-2 border border-line rounded-md">
    <div class="font-mono font-medium text-[13px] leading-none tracking-[0.1em] uppercase text-muted mb-[14px]">How the score splits</div>
    <div class="flex h-[14px] rounded-[7px] overflow-hidden gap-[2px] mb-[14px]">
      <div class="h-full bg-data-main" :style="{ width: weights.affordability + '%' }" />
      <div class="h-full bg-data-mid" :style="{ width: weights.schools + '%' }" />
      <div class="h-full bg-data-light" :style="{ width: weights.transport + '%' }" />
      <div class="h-full bg-data-mid" :style="{ width: weights.gp_access + '%' }" />
    </div>
    <div class="flex flex-col gap-2 font-sans text-[16px] leading-[1.3] text-body">
      <div class="flex justify-between"><span>Rent affordability</span><span class="font-mono text-ink">{{ weights.affordability }}%</span></div>
      <div class="flex justify-between"><span>Schools</span><span class="font-mono text-ink">{{ weights.schools }}%</span></div>
      <div class="flex justify-between"><span>Public transport</span><span class="font-mono text-ink">{{ weights.transport }}%</span></div>
      <div class="flex justify-between"><span>Bulk-billing doctors</span><span class="font-mono text-ink">{{ weights.gp_access }}%</span></div>
    </div>
  </div>
</template>
