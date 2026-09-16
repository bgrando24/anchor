<script setup lang="ts">
const { init } = useTheme()
onMounted(() => init())
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
