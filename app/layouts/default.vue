<script setup lang="ts">
// Every page gets the same header and offline band. The print sheet uses its own layout.
// The front door sits under a terracotta band; everything else keeps the calm cream page.
const route = useRoute()
const isHome = computed(() => route.path === '/')
</script>

<template>
  <div class="min-h-screen bg-bg">
    <OfflineBanner />
    <div :class="isHome ? 'bg-accent' : ''">
      <AppHeader :variant="isHome ? 'accent' : 'light'" />
    </div>
    <slot />
  </div>
</template>
