<script setup lang="ts">
const { theme, toggle } = useTheme()
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center justify-center w-11 h-11 rounded-full border border-current bg-transparent text-[inherit] opacity-85 text-[18px] cursor-pointer shrink-0 hover:bg-[rgba(127,127,127,0.12)]"
    :aria-pressed="theme === 'dark'"
    :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggle"
  >
    <span aria-hidden="true">{{ theme === 'dark' ? '☀' : '◑' }}</span>
  </button>
</template>
