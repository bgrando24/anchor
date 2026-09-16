<script setup lang="ts">
const { theme, toggle } = useTheme()
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-pressed="theme === 'dark'"
    :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggle"
  >
    <span aria-hidden="true">{{ theme === 'dark' ? '☀' : '◑' }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
  opacity: 0.85;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.theme-toggle:hover {
  background: rgba(127, 127, 127, 0.12);
}
</style>
