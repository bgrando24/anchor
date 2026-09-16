<script setup lang="ts">
import { PRIORITY_FACTORS } from '~/data/options'

useHead({ title: 'ANCHOR — what matters most to you?' })

const { answers } = useAnchorState()

const weights = computed(() => computeFactorWeights(answers.value.weights))
</script>

<template>
  <div class="page">
    <main class="content">
      <ProgressBar :current-step="3" back-to="/location/area" />
      <h1>What matters most to you?</h1>
      <p class="lede">There's no right answer. This just tells us how to weigh things up.</p>

      <div class="fixed-card">
        <div class="fixed-row">
          <div class="fixed-title">Rent affordability</div>
          <div class="fixed-value">50% &mdash; fixed</div>
        </div>
        <div class="fixed-track">
          <div class="fixed-fill" />
        </div>
        <div class="fixed-body">
          Always half the score, and you can't change it. Being able to pay the rent is the point of this tool.
        </div>
      </div>

      <div class="factors">
        <div v-for="f in PRIORITY_FACTORS" :key="f.key" class="factor">
          <div class="factor-title">{{ f.label }}</div>
          <div class="factor-desc">{{ f.description }}</div>
          <TierSelector v-model="answers.weights[f.key]" :label="f.label" />
        </div>
      </div>

      <WeightSplitBar :weights="weights" />

      <NuxtLink to="/results" class="btn-primary">See the areas</NuxtLink>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
}

.content {
  max-width: 560px;
  margin: 0 auto;
  padding: 20px 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

h1 {
  margin: 0;
  font: 600 27px/1.22 var(--font-sans);
  color: var(--ink);
  letter-spacing: -0.01em;
}

.lede {
  margin: -12px 0 0;
  font: 400 17px/1.5 var(--font-sans);
  color: var(--body);
}

.fixed-card {
  padding: 18px 20px;
  background: var(--surface-info);
  border-radius: var(--radius-md);
}

.fixed-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.fixed-title {
  font: 600 18px/1.3 var(--font-sans);
  color: var(--ink);
}

.fixed-value {
  font: 600 17px/1 var(--font-mono);
  color: var(--surface-info-text);
}

.fixed-track {
  height: 10px;
  border-radius: 5px;
  background: var(--border);
  overflow: hidden;
  margin-bottom: 12px;
}

.fixed-fill {
  width: 50%;
  height: 100%;
  border-radius: 5px;
  background: var(--data-main);
}

.fixed-body {
  font: 400 16px/1.5 var(--font-sans);
  color: var(--body);
}

.factors {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.factor-title {
  font: 600 19px/1.3 var(--font-sans);
  color: var(--ink);
  margin-bottom: 3px;
}

.factor-desc {
  font: 400 16px/1.45 var(--font-sans);
  color: var(--body);
  margin-bottom: 12px;
}
</style>
