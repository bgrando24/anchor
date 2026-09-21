<script setup lang="ts">
withDefaults(
  defineProps<{
    currentStep: number
    total?: number
    backTo?: string
  }>(),
  { total: 4, backTo: undefined }
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-[10px]">
      <NuxtLink
        v-if="backTo"
        :to="backTo"
        class="inline-flex items-center justify-center w-11 h-11 -ml-3 border-none bg-transparent text-body text-[22px] no-underline rounded-full hover:bg-surface-info"
        aria-label="Go back"
      >
        <span aria-hidden="true">&#8592;</span>
      </NuxtLink>
      <div class="font-mono font-medium text-[15px] leading-none text-muted">Step {{ currentStep }} of {{ total }}</div>
    </div>
    <div class="flex gap-[5px]" role="img" :aria-label="`Step ${currentStep} of ${total}`">
      <div
        v-for="i in total"
        :key="i"
        class="h-[5px] flex-1 rounded-[3px]"
        :class="i <= currentStep ? 'bg-accent' : 'bg-line'"
      />
    </div>
  </div>
</template>
