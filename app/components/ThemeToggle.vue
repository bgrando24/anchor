<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'

const { theme, toggle } = useTheme()
</script>

<template>
  <button
    type="button"
    class="icon-button border border-current opacity-90"
    :aria-pressed="theme === 'dark'"
    :aria-label="theme === 'dark' ? 'Light mode' : 'Dark mode'"
    @click="toggle"
  >
    <component :is="theme === 'dark' ? Sun : Moon" :size="18" aria-hidden="true" />
  </button>
</template>
