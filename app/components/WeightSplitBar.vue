<script setup lang="ts">
defineProps<{
  weights: { affordability: number; schools: number; transport: number; gp_access: number }
}>()
</script>

<template>
  <div class="weight-split">
    <div class="title">How the score splits</div>
    <div class="bar">
      <div class="seg main" :style="{ width: weights.affordability + '%' }" />
      <div class="seg mid" :style="{ width: weights.schools + '%' }" />
      <div class="seg light" :style="{ width: weights.transport + '%' }" />
      <div class="seg mid" :style="{ width: weights.gp_access + '%' }" />
    </div>
    <div class="legend">
      <div class="legend-row"><span>Rent affordability</span><span class="num">{{ weights.affordability }}%</span></div>
      <div class="legend-row"><span>Schools</span><span class="num">{{ weights.schools }}%</span></div>
      <div class="legend-row"><span>Public transport</span><span class="num">{{ weights.transport }}%</span></div>
      <div class="legend-row"><span>Bulk-billing doctors</span><span class="num">{{ weights.gp_access }}%</span></div>
    </div>
  </div>
</template>

<style scoped>
.weight-split {
  padding: 18px 20px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.title {
  font: 500 13px/1 var(--font-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 14px;
}

.bar {
  display: flex;
  height: 14px;
  border-radius: 7px;
  overflow: hidden;
  gap: 2px;
  margin-bottom: 14px;
}

.seg {
  height: 100%;
}

.seg.main {
  background: var(--data-main);
}

.seg.mid {
  background: var(--data-mid);
}

.seg.light {
  background: var(--data-light);
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font: 400 16px/1.3 var(--font-sans);
  color: var(--body);
}

.legend-row {
  display: flex;
  justify-content: space-between;
}

.num {
  font-family: var(--font-mono);
  color: var(--ink);
}
</style>
