<script setup lang="ts">
import { PAYMENT_TYPES, PRIORITY_FACTORS } from '~/data/options'

useHead({ title: 'ANCHOR — 79 areas, ranked for you' })

const route = useRoute()
const { answers } = useAnchorState()
const { byCode } = useLgaData()

onMounted(() => {
  const decoded = decodeAnswersFromQuery(route.query as Record<string, unknown>)
  if (decoded) {
    answers.value = { ...answers.value, ...decoded, weights: decoded.weights ?? answers.value.weights }
  }
})

const scored = computed(() => useScoring().rankAll(answers.value.weights))

const showAll = ref(false)
const tableView = ref(false)

const TOP_N = 10
const visible = computed(() => (showAll.value ? scored.value : scored.value.slice(0, TOP_N)))
const remaining = computed(() => Math.max(0, scored.value.length - TOP_N))

const paymentLabel = computed(
  () => PAYMENT_TYPES.find((p) => p.value === answers.value.paymentType)?.label ?? null
)
const currentLgaName = computed(() => byCode(answers.value.currentLga)?.lga_name ?? null)
const prioritySummary = computed(() => {
  const named = PRIORITY_FACTORS.filter((f) => answers.value.weights[f.key] !== 'not_much').map((f) => f.label)
  return named.length ? named.join(', ') : 'Even priorities'
})

function isCurrent(code: number) {
  return answers.value.currentLga === code
}
</script>

<template>
  <div class="page">
    <div class="band-wrap">
      <AppHeader variant="band" share-to="/share" />
      <div class="band-body">
        <h1>79 areas, ranked for you</h1>
        <p class="lede">Best first. Rent affordability is half of every score.</p>
        <div class="chips">
          <div v-if="paymentLabel" class="chip">{{ paymentLabel }}</div>
          <div v-if="currentLgaName" class="chip">{{ currentLgaName }}</div>
          <div class="chip">{{ prioritySummary }}</div>
          <NuxtLink to="/income" class="change-link">Change answers</NuxtLink>
        </div>
      </div>
    </div>

    <div class="body-grid">
      <aside class="sidebar">
        <div class="sidebar-title">Your answers</div>
        <div class="answer-rows">
          <div><div class="answer-k">Payment</div><div class="answer-v">{{ paymentLabel ?? '—' }}</div></div>
          <div><div class="answer-k">Living in</div><div class="answer-v">{{ currentLgaName ?? '—' }}</div></div>
        </div>
        <div class="sidebar-rule" />
        <div class="sidebar-title">Weighting</div>
        <WeightSplitBar :weights="scored[0]?.scoreWeights ?? { affordability: 50, schools: 0, transport: 0, gp_access: 0 }" />
        <NuxtLink to="/income" class="btn-secondary change-btn">Change answers</NuxtLink>
        <p class="sidebar-note">Rent affordability is always half the score and can't be changed.</p>
      </aside>

      <main class="content">
        <SuggestionBanner />

        <div class="col-headers">
          <div>#</div><div>Area</div><div>Affordable</div><div>Steadiness</div><div class="right">Score</div>
        </div>

        <div v-if="!tableView" class="rows">
          <article v-for="r in visible" :key="r.lga_code" class="row">
            <div class="rank">{{ r.rank }}</div>
            <div class="row-name">
              <div class="row-head">
                <NuxtLink :to="`/results/${r.lga_code}`" class="name-link">{{ r.lga_name }}</NuxtLink>
                <span class="region-tag">{{ r.subregion }}</span>
                <span v-if="isCurrent(r.lga_code)" class="current-tag">Where you live now</span>
              </div>
              <div class="stat mobile-only">
                <span class="stat-num">{{ oneIn(r.affordability_pct_latest) }}</span>
                <span class="stat-word">rentals affordable</span>
              </div>
              <div class="stat-meta mobile-only">{{ pctLabel(r.affordability_pct_latest) }} last quarter &middot; {{ stabilityLabel(r.affordability_pct_5yr_stddev) }}</div>
              <div class="why">{{ explainRanking(r, isCurrent(r.lga_code)) }}</div>
              <div class="score-row mobile-only">
                <div class="score-track"><div class="score-fill" :style="{ width: (r.scores.total * 10) + '%' }" /></div>
                <div class="score-num">{{ r.scores.total.toFixed(1) }} / 10</div>
              </div>
              <NuxtLink :to="`/results/${r.lga_code}`" class="detail-link mobile-only">See the detail for {{ r.lga_name }}</NuxtLink>
            </div>
            <div class="col-affordable desktop-only">
              <div class="afford-num">{{ oneIn(r.affordability_pct_latest) }}</div>
              <div class="afford-pct">{{ pctLabel(r.affordability_pct_latest) }}</div>
            </div>
            <div class="col-steady desktop-only">{{ stabilityLabel(r.affordability_pct_5yr_stddev) }}</div>
            <div class="col-score desktop-only">
              <div class="score-num">{{ r.scores.total.toFixed(1) }} / 10</div>
              <div class="score-track"><div class="score-fill" :style="{ width: (r.scores.total * 10) + '%' }" /></div>
            </div>
          </article>
        </div>

        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Area</th>
                <th scope="col">Affordable</th>
                <th scope="col">Steadiness</th>
                <th scope="col" class="right">Score</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in scored" :key="r.lga_code">
                <td>{{ r.rank }}</td>
                <td><NuxtLink :to="`/results/${r.lga_code}`">{{ r.lga_name }}</NuxtLink></td>
                <td>{{ pctLabel(r.affordability_pct_latest) }}</td>
                <td>{{ stabilityWord(r.affordability_pct_5yr_stddev) }}</td>
                <td class="right">{{ r.scores.total.toFixed(1) }} / 10</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="footer-actions">
          <button v-if="!tableView && !showAll" type="button" class="btn-secondary" @click="showAll = true">
            Show the remaining {{ remaining }} areas
          </button>
          <button type="button" class="table-toggle" @click="tableView = !tableView">
            {{ tableView ? 'View as a list' : 'View all 79 as a table' }}
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
}

.band-wrap {
  background: var(--header-band);
  color: var(--header-band-text);
}

.band-body {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.band-body h1 {
  margin: 0;
  font: 600 26px/1.25 var(--font-sans);
  letter-spacing: -0.01em;
}

.lede {
  margin: 0 0 6px;
  font: 400 16px/1.5 var(--font-sans);
  color: var(--header-band-body);
}

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.chip {
  padding: 7px 13px;
  background: var(--header-chip-bg);
  border-radius: 999px;
  font: 400 14px/1.3 var(--font-sans);
  color: var(--header-chip-text);
}

.change-link {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  padding: 0 13px;
  border: 1px solid var(--header-chip-outline);
  border-radius: 999px;
  color: var(--header-cta);
  font: 500 14px/1 var(--font-sans);
  text-decoration: none;
}

.body-grid {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
}

.sidebar {
  display: none;
}

.content {
  padding: 0;
}

.col-headers {
  display: none;
}

.rows {
  display: flex;
  flex-direction: column;
}

.row {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-hairline);
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.rank {
  width: 34px;
  flex-shrink: 0;
  text-align: right;
  font: 500 20px/1 var(--font-mono);
  color: var(--data-main);
}

.row-name {
  flex: 1;
  min-width: 0;
}

.desktop-only {
  display: none;
}

.row-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.name-link {
  font: 600 21px/1.25 var(--font-sans);
  color: var(--ink);
  text-decoration: none;
}

.region-tag {
  font: 400 14px/1 var(--font-mono);
  color: var(--muted);
}

.current-tag {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 10px;
  background: var(--surface-info);
  border-radius: 6px;
  font: 500 14px/1.3 var(--font-sans);
  color: var(--surface-info-text);
}

.stat {
  margin-top: 12px;
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.stat-num {
  font: 600 28px/1 var(--font-sans);
  color: var(--ink);
  letter-spacing: -0.01em;
}

.stat-word {
  font: 400 16px/1.3 var(--font-sans);
  color: var(--body);
}

.stat-meta {
  margin-top: 6px;
  font: 400 14px/1.3 var(--font-mono);
  color: var(--muted);
}

.why {
  margin-top: 10px;
  font: 400 16px/1.5 var(--font-sans);
  color: var(--body);
}

.score-row {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-track {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: var(--border);
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: 4px;
  background: var(--data-main);
}

.score-num {
  font: 500 15px/1 var(--font-mono);
  color: var(--ink);
  min-width: 72px;
  flex-shrink: 0;
  white-space: nowrap;
  text-align: right;
}

.detail-link {
  display: inline-block;
  margin-top: 14px;
  min-height: 44px;
  line-height: 44px;
  font: 500 17px/44px var(--font-sans);
}

.table-wrap {
  padding: 16px 24px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font: 400 16px/1.4 var(--font-sans);
}

th,
td {
  text-align: left;
  padding: 10px 12px;
  border-top: 1px solid var(--border-hairline);
  font-family: var(--font-mono);
  color: var(--ink);
}

thead th {
  border-top: none;
  font: 500 12px/1 var(--font-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}

.right {
  text-align: right;
}

.footer-actions {
  padding: 22px 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.table-toggle {
  border: none;
  background: none;
  padding: 0;
  font: 500 16px/1.4 var(--font-sans);
  color: var(--accent);
  text-decoration: underline;
  text-align: center;
  cursor: pointer;
}

@media (min-width: 860px) {
  .band-body {
    padding: 22px 40px 22px;
  }

  .body-grid {
    grid-template-columns: 312px 1fr;
  }

  .sidebar {
    display: block;
    padding: 34px 32px;
    border-right: 1px solid var(--border);
    background: var(--surface-2);
  }

  .sidebar-title {
    font: 500 12px/1 var(--font-mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 16px;
  }

  .answer-rows {
    display: flex;
    flex-direction: column;
    gap: 18px;
    font: 400 16px/1.4 var(--font-sans);
    margin-bottom: 24px;
  }

  .answer-k {
    color: var(--muted);
    margin-bottom: 4px;
  }

  .answer-v {
    color: var(--ink);
    font-weight: 500;
  }

  .sidebar-rule {
    height: 1px;
    background: var(--border-hairline);
    margin: 8px 0 22px;
  }

  .change-btn {
    width: 100%;
    margin-top: 22px;
  }

  .sidebar-note {
    margin: 16px 0 0;
    font: 400 15px/1.5 var(--font-sans);
    color: var(--muted);
  }

  .col-headers {
    display: grid;
    grid-template-columns: 44px 1fr 150px 190px 120px;
    gap: 20px;
    padding: 0 40px 10px;
    font: 500 12px/1 var(--font-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .row {
    padding: 20px 40px;
    display: grid;
    grid-template-columns: 44px 1fr 150px 190px 120px;
    gap: 20px;
    align-items: start;
    border-top: 1px solid var(--border-hairline);
    border-bottom: none;
  }

  .rank {
    text-align: left;
    font-size: 20px;
  }

  .row-head {
    flex-wrap: nowrap;
  }

  .mobile-only {
    display: none;
  }

  .desktop-only {
    display: block;
  }

  .why {
    margin-top: 8px;
    max-width: 58ch;
  }

  .col-affordable .afford-num {
    font: 600 22px/1.1 var(--font-sans);
    color: var(--ink);
  }

  .col-affordable .afford-pct {
    margin-top: 5px;
    font: 400 14px/1.3 var(--font-mono);
    color: var(--muted);
  }

  .col-steady {
    font: 400 16px/1.4 var(--font-sans);
    color: var(--body);
  }

  .col-score .score-num {
    font: 500 16px/1 var(--font-mono);
    color: var(--ink);
    text-align: right;
    margin-bottom: 8px;
  }

  .col-score .score-track {
    height: 8px;
    border-radius: 4px;
    background: var(--border);
    overflow: hidden;
  }

  .col-score .score-fill {
    height: 100%;
    border-radius: 4px;
    background: var(--data-main);
  }

  .table-wrap {
    padding: 16px 40px;
  }

  .footer-actions {
    flex-direction: row;
    align-items: center;
    padding: 26px 40px 34px;
  }
}
</style>
