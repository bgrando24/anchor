<script setup lang="ts">
useHead({
  titleTemplate: (title) => (title ? `${title} | Anchor` : 'Anchor'),
  script: [{ innerHTML: THEME_INIT_SCRIPT, tagPosition: 'head' }],
  meta: [
    { name: 'color-scheme', content: 'light dark' },
    { name: 'theme-color', content: '#1B2A3A', media: '(prefers-color-scheme: light)' },
    { name: 'theme-color', content: '#141A21', media: '(prefers-color-scheme: dark)' }
  ]
})

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
    <NuxtPwaManifest />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
