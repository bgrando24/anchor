<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

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
      <NuxtLink v-if="backTo" :to="backTo" class="icon-button -ml-3 text-body no-underline" aria-label="Back">
        <ArrowLeft :size="22" aria-hidden="true" />
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
