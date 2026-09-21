<script setup lang="ts">
useHead({ titleTemplate: (title) => (title ? `${title} | Anchor` : 'Anchor') })

const { init: initTheme } = useTheme()
const { init: initInstallPrompt } = useInstallPrompt()
onMounted(() => {
  initTheme()
  initInstallPrompt()
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <OfflineBanner />
    <NuxtPage />
  </div>
</template>
