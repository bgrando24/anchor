<script setup lang="ts">
withDefaults(
  defineProps<{
    split: { rent: number; schools: number; transport: number; gp_access: number }
    /** Set false where the surrounding page already carries the heading. */
    showTitle?: boolean
  }>(),
  { showTitle: true }
)

const ROWS = [
  { key: 'rent', label: 'Rent', colour: 'bg-data-main' },
  { key: 'schools', label: 'Schools', colour: 'bg-data-mid' },
  { key: 'transport', label: 'Train stations', colour: 'bg-data-light' },
  { key: 'gp_access', label: 'Bulk-billing doctors', colour: 'bg-data-mid' }
] as const
</script>

<template>
  <div class="py-[18px] px-5 bg-surface-2 border border-line rounded-md">
    <h2
      v-if="showTitle"
      class="m-0 font-mono font-medium text-[13px] leading-none tracking-[0.1em] uppercase text-muted mb-[14px]"
    >
      How each area is scored
    </h2>
    <div class="flex h-[14px] rounded-[7px] overflow-hidden gap-[2px] mb-[14px]" aria-hidden="true">
      <div v-for="r in ROWS" :key="r.key" class="h-full" :class="r.colour" :style="{ width: split[r.key] + '%' }" />
    </div>
    <div class="flex flex-col gap-2 font-sans text-[16px] leading-[1.3] text-body">
      <div v-for="r in ROWS" :key="r.key" class="flex justify-between gap-3">
        <span>{{ r.label }}</span><span class="font-mono text-ink">{{ split[r.key] }}%</span>
      </div>
    </div>
  </div>
</template>
