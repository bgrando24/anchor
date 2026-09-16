<script setup lang="ts">
withDefaults(
  defineProps<{
    currentStep: number
    total?: number
    backTo?: string
  }>(),
  { total: 4, backTo: undefined }
)
</script>

<template>
  <div class="wizard-head">
    <div class="row">
      <NuxtLink v-if="backTo" :to="backTo" class="back-btn" aria-label="Go back">
        <span aria-hidden="true">&#8592;</span>
      </NuxtLink>
      <div class="step-label">Step {{ currentStep }} of {{ total }}</div>
    </div>
    <div class="segments" role="img" :aria-label="`Step ${currentStep} of ${total}`">
      <div
        v-for="i in total"
        :key="i"
        class="segment"
        :class="{ filled: i <= currentStep }"
      />
    </div>
  </div>
</template>

<style scoped>
.wizard-head {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-left: -12px;
  border: none;
  background: none;
  color: var(--body);
  font-size: 22px;
  text-decoration: none;
  border-radius: 999px;
}

.back-btn:hover {
  background: var(--surface-info);
}

.step-label {
  font: 500 15px/1 var(--font-mono);
  color: var(--muted);
}

.segments {
  display: flex;
  gap: 5px;
}

.segment {
  height: 5px;
  flex: 1;
  border-radius: 3px;
  background: var(--border);
}

.segment.filled {
  background: var(--accent);
}
</style>
