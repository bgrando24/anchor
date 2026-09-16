<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'light' | 'band'
    howThisWorks?: boolean
    backTo?: string
    backLabel?: string
    shareTo?: string
  }>(),
  {
    variant: 'light',
    howThisWorks: false,
    backTo: undefined,
    backLabel: 'All areas',
    shareTo: '/share'
  }
)
</script>

<template>
  <header class="app-header" :class="variant">
    <div class="left">
      <NuxtLink v-if="backTo" :to="backTo" class="back-link">
        <span aria-hidden="true">&#8592;</span> {{ backLabel }}
      </NuxtLink>
      <div class="wordmark">ANCHOR</div>
    </div>
    <div class="right">
      <NuxtLink v-if="howThisWorks" to="/faq" class="how-link">How this works</NuxtLink>
      <NuxtLink v-if="variant === 'band'" :to="shareTo" class="btn-secondary share-btn">Save or share</NuxtLink>
      <ThemeToggle />
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 24px;
}

.left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wordmark {
  font: 700 15px/1 var(--font-sans);
  letter-spacing: 0.18em;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  text-decoration: none;
  font: 500 15px/1 var(--font-sans);
}

.app-header.light {
  background: var(--bg);
  color: var(--ink);
}

.app-header.light .how-link {
  font: 500 15px/1 var(--font-sans);
}

.app-header.light .back-link {
  color: var(--body);
}

.app-header.band {
  background: var(--header-band);
  color: var(--header-band-text);
  border-radius: inherit;
}

.app-header.band .back-link {
  color: var(--header-band-body);
}

.share-btn {
  min-height: 44px;
  background: transparent;
  border-color: var(--header-chip-outline);
  color: var(--header-chip-text);
  font-size: 15px;
}

.share-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}
</style>
