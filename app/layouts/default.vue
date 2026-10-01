<script setup lang="ts">
// Every page gets the same header and offline band. The print sheet uses its own layout.
</script>

<template>
  <div class="min-h-screen bg-bg">
    <OfflineBanner />
    <AppHeader />
    <slot />
  </div>
</template>
