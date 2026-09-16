<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: number
    sublabel: string
    tone?: 'affordability' | 'factor'
  }>(),
  { tone: 'factor' }
)
</script>

<template>
  <div class="score-bar">
    <div class="row">
      <span class="label">{{ label }}</span>
      <span class="value">{{ value.toFixed(1) }} / 10</span>
    </div>
    <div class="sublabel">{{ sublabel }}</div>
    <div class="track">
      <div
        class="fill"
        :class="tone"
        :style="{ width: Math.min(100, Math.max(0, (value / 10) * 100)) + '%' }"
      />
    </div>
  </div>
</template>

<style scoped>
.score-bar {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
}

.label {
  font: 600 18px/1.3 var(--font-sans);
  color: var(--ink);
}

.value {
  font: 500 16px/1 var(--font-mono);
  color: var(--ink);
}

.sublabel {
  font: 400 16px/1.4 var(--font-sans);
  color: var(--body);
  margin-bottom: 10px;
}

.track {
  height: 12px;
  border-radius: 6px;
  background: var(--border);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: 6px;
}

.fill.factor {
  background: var(--data-main);
}

.fill.affordability {
  background: var(--data-affordability);
}
</style>
