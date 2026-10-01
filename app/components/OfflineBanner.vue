<script setup lang="ts">
import { WifiOff } from 'lucide-vue-next'

const { isOnline, init } = useOnlineStatus()
onMounted(() => init())
</script>

<template>
  <div
    v-if="!isOnline"
    class="flex items-center gap-[10px] py-[14px] px-4 dt:px-6 bg-surface-info border-b border-line font-sans font-medium text-[15px] leading-[1.35] text-surface-info-text print:hidden"
    role="status"
  >
    <WifiOff :size="18" class="shrink-0" aria-hidden="true" />
    You're offline. Pages you've already opened still work.
  </div>
</template>
