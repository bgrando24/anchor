<script setup lang="ts">
// A roof on a base line, for "somewhere to stay". Drawn in currentColor so it works on
// the cream page, the navy band and the printed sheet. Geometry from assets/logo-mark-mono.svg.
withDefaults(defineProps<{ size?: number }>(), { size: 24 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 512 512"
    fill="none"
    stroke="currentColor"
    stroke-width="44"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="shrink-0"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M148 300 L256 192 L364 300" />
    <line x1="160" y1="360" x2="352" y2="360" />
  </svg>
</template>
