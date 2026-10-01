<script setup lang="ts">
// Results and area detail sit under the navy band, so the header is part of it.
</script>

<template>
  <div class="min-h-screen bg-bg">
    <OfflineBanner />
    <div class="bg-header-band">
      <AppHeader variant="band" />
    </div>
    <slot />
  </div>
</template>
