<script setup lang="ts">
// Results and area detail both sit under a band, so the header is part of it. The list stays
// navy and an area page is terracotta, so stepping into an area visibly changes the page.
const route = useRoute()
const isArea = computed(() => /^\/results\/\d+$/.test(route.path))
</script>

<template>
  <div class="min-h-screen bg-bg">
    <OfflineBanner />
    <div :class="isArea ? 'bg-accent' : 'bg-header-band'">
      <AppHeader :variant="isArea ? 'accent' : 'band'" />
    </div>
    <slot />
  </div>
</template>
