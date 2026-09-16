<script setup lang="ts">
useHead({ title: 'ANCHOR — where do you live now?' })

const { answers } = useAnchorState()
const { search, subregionCount } = useLgaData()

const query = ref('')
const matches = computed(() => search(query.value))
const searching = computed(() => query.value.trim().length > 0)

function selectMatch(code: string | number) {
  answers.value.currentLga = Number(code)
}

function clearSearch() {
  query.value = ''
}

const canContinue = computed(() => answers.value.currentLga != null)
</script>

<template>
  <div class="page">
    <main class="content">
      <ProgressBar :current-step="2" back-to="/income" />
      <h1>Where do you live now?</h1>
      <p class="lede">Start with the part of Victoria. Pick your area on the next screen.</p>

      <div class="search-field">
        <label for="area-search" class="search-label">Or search for your area</label>
        <div class="search-input-wrap">
          <input
            id="area-search"
            v-model="query"
            type="text"
            class="search-input"
            placeholder="Start typing an area name"
            autocomplete="off"
          />
          <button v-if="query" type="button" class="clear-btn" aria-label="Clear search" @click="clearSearch">
            &#215;
          </button>
        </div>
      </div>

      <template v-if="searching">
        <p class="match-count">
          {{ matches.length }} of 79 areas match{{ matches.length === 1 ? 'es' : '' }}. You can only choose from the
          list.
        </p>

        <div v-if="matches.length" class="options" role="radiogroup" aria-label="Matching areas">
          <RadioOption
            v-for="m in matches"
            :key="m.lga_code"
            name="area-search-result"
            :value="m.lga_code"
            :label="m.lga_name"
            :sublabel="`${m.region} — ${m.subregion}`"
            :model-value="answers.currentLga"
            @update:model-value="selectMatch"
          />
        </div>

        <div v-else class="empty-state">
          <div class="empty-title">If nothing matches</div>
          <div class="empty-body">
            No area is called that. Check the spelling, or browse by region instead. The Continue button stays
            disabled until a listed area is selected &mdash; typing alone never sets an answer.
          </div>
        </div>

        <button type="button" class="btn-secondary browse-btn" @click="clearSearch">
          Browse by region instead
        </button>

        <NuxtLink
          to="/priorities"
          class="btn-primary"
          :class="{ disabled: !canContinue }"
          :aria-disabled="!canContinue"
          @click="!canContinue && $event.preventDefault()"
        >
          Continue
        </NuxtLink>

        <p class="footnote">
          Search is a filter over the fixed list of 79, not an input. The typed text is never stored, never encoded
          into the URL, and never reaches the scoring code &mdash; only the selected area code does.
        </p>
      </template>

      <template v-else>
        <div v-for="group in REGION_GROUPS" :key="group.region" class="region-group">
          <div class="region-title">{{ group.region }}</div>
          <div class="region-grid">
            <NuxtLink
              v-for="sub in group.subregions"
              :key="sub"
              :to="{ path: '/location/area', query: { region: sub } }"
              class="region-btn"
            >
              {{ sub }}
              <span class="count">{{ subregionCount(sub) }} areas</span>
            </NuxtLink>
          </div>
        </div>
        <p class="footnote">Nine regions, then at most twelve areas. No typing, no 79-item scroll.</p>
      </template>
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
  gap: 20px;
}

h1 {
  margin: 0;
  font: 600 27px/1.22 var(--font-sans);
  color: var(--ink);
  letter-spacing: -0.01em;
}

.lede {
  margin: -8px 0 0;
  font: 400 17px/1.5 var(--font-sans);
  color: var(--body);
}

.search-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-label {
  font: 500 16px/1.4 var(--font-sans);
  color: var(--ink);
}

.search-input-wrap {
  min-height: 56px;
  padding: 0 18px;
  background: var(--surface-2);
  border: 2px solid var(--surface-info-text);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  font: 400 18px/1 var(--font-sans);
  color: var(--ink);
  min-height: 44px;
}

.search-input:focus {
  outline: none;
}

.clear-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: var(--surface-info);
  color: var(--body);
  font-size: 15px;
  cursor: pointer;
  flex-shrink: 0;
}

.match-count {
  margin: -8px 0 0;
  font: 400 15px/1.45 var(--font-sans);
  color: var(--muted);
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-state {
  padding: 16px 18px;
  background: var(--surface-missing);
  border: 1px dashed var(--border-missing);
  border-radius: var(--radius-md);
}

.empty-title {
  font: 600 16px/1.4 var(--font-sans);
  color: var(--muted-missing-heading);
  margin-bottom: 5px;
}

.empty-body {
  font: 400 15px/1.5 var(--font-sans);
  color: var(--muted-missing-body);
}

.browse-btn {
  width: 100%;
}

.footnote {
  margin: 0;
  font: 400 15px/1.5 var(--font-sans);
  color: var(--muted);
}

.region-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.region-title {
  font: 500 13px/1 var(--font-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}

.region-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.region-btn {
  min-height: 76px;
  padding: 12px 14px;
  text-align: left;
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  font: 500 17px/1.3 var(--font-sans);
  color: var(--ink);
  cursor: pointer;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.count {
  font: 400 14px/1 var(--font-mono);
  color: var(--muted);
}

.disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
