<script setup lang="ts">
useHead({ title: 'ANCHOR — which area?' })

const route = useRoute()
const { answers } = useAnchorState()
const { bySubregion, all } = useLgaData()

const region = computed(() => String(route.query.region ?? ''))
const areas = computed(() => bySubregion(region.value))

const sortedAll = computed(() => [...all].sort((a, b) => a.lga_name.localeCompare(b.lga_name)))

function selectArea(code: string | number) {
  answers.value.currentLga = Number(code)
}

const canContinue = computed(() => answers.value.currentLga != null)
</script>

<template>
  <div class="page">
    <main class="content">
      <ProgressBar :current-step="2" back-to="/location" />

      <NuxtLink to="/location" class="region-chip">
        {{ region }} <span class="change">change</span>
      </NuxtLink>
      <h1>Which area?</h1>

      <div v-if="areas.length" class="options" role="radiogroup" :aria-label="`Which area in ${region}`">
        <RadioOption
          v-for="a in areas"
          :key="a.lga_code"
          name="area-choice"
          :value="a.lga_code"
          :label="a.lga_name"
          :model-value="answers.currentLga"
          @update:model-value="selectArea"
        />
      </div>
      <p v-else class="empty-body">
        That region wasn't recognised. <NuxtLink to="/location">Go back and pick a region.</NuxtLink>
      </p>

      <div class="work-block">
        <div class="block-title">Where do you work?</div>
        <div class="block-body">Optional. Used only to reason about transport.</div>
        <label class="visually-hidden" for="work-lga">Where do you work</label>
        <select id="work-lga" v-model.number="answers.workLga" class="field-select">
          <option :value="null">Choose an area &mdash; or skip</option>
          <option v-for="a in sortedAll" :key="a.lga_code" :value="a.lga_code">{{ a.lga_name }}</option>
        </select>
      </div>

      <NuxtLink
        to="/priorities"
        class="btn-primary"
        :class="{ disabled: !canContinue }"
        :aria-disabled="!canContinue"
        @click="!canContinue && $event.preventDefault()"
      >
        Continue
      </NuxtLink>
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
  gap: 18px;
}

.region-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  padding: 8px 14px;
  background: var(--surface-info);
  border-radius: 999px;
  font: 500 15px/1 var(--font-sans);
  color: var(--surface-info-text);
  text-decoration: none;
}

.change {
  opacity: 0.75;
}

h1 {
  margin: 0;
  font: 600 27px/1.22 var(--font-sans);
  color: var(--ink);
  letter-spacing: -0.01em;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-body {
  font: 400 16px/1.5 var(--font-sans);
  color: var(--body);
}

.work-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.block-title {
  font: 600 19px/1.3 var(--font-sans);
  color: var(--ink);
}

.block-body {
  font: 400 16px/1.5 var(--font-sans);
  color: var(--body);
  margin-bottom: 8px;
}

.disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
