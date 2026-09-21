<script setup lang="ts">
defineProps<{ label: string; note: string }>()
</script>

<template>
  <div class="py-4 px-[18px] bg-surface-missing border border-dashed border-line-missing rounded-md">
    <div class="flex justify-between items-baseline gap-3 mb-1">
      <span class="font-sans font-semibold text-[18px] leading-[1.3] text-muted-missing-heading">{{ label }}</span>
      <span class="font-mono font-medium text-[15px] leading-none text-muted-missing-heading shrink-0">No data</span>
    </div>
    <div class="font-sans text-[16px] leading-[1.45] text-muted-missing-body">{{ note }}</div>
  </div>
</template>
