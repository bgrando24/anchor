<script setup lang="ts">
const { isOnline, init } = useOnlineStatus()
onMounted(() => init())
</script>

<template>
  <div
    v-if="!isOnline"
    class="flex items-center gap-[10px] py-[14px] px-6 bg-surface-info border-b border-line font-sans font-medium text-[15px] leading-[1.3] text-surface-info-text"
    role="status"
  >
    <span class="w-[9px] h-[9px] rounded-full bg-surface-info-text shrink-0" aria-hidden="true" />
    You're offline. Everything you've loaded still works.
  </div>
</template>
