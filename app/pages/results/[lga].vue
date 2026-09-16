<script setup lang="ts">
const route = useRoute()
const { answers } = useAnchorState()
const { byCode } = useLgaData()

const code = computed(() => Number(route.params.lga))
const lga = computed(() => byCode(code.value))

const scored = computed(() => (lga.value ? useScoring().scoreOne(lga.value, answers.value.weights) : null))

const currentLga = computed(() =>
  answers.value.currentLga != null && answers.value.currentLga !== code.value
    ? byCode(answers.value.currentLga)
    : undefined
)
const currentScored = computed(() =>
  currentLga.value ? useScoring().scoreOne(currentLga.value, answers.value.weights) : null
)

const comparisonRows = computed(() =>
  scored.value && currentScored.value ? compareToCurrent(scored.value, currentScored.value) : []
)

const viewMode = ref<'bars' | 'table'>('bars')

function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  const mod10 = n % 10
  if (mod10 === 1) return `${n}st`
  if (mod10 === 2) return `${n}nd`
  if (mod10 === 3) return `${n}rd`
  return `${n}th`
}

useHead({ title: () => (lga.value ? `ANCHOR — ${lga.value.lga_name}` : 'ANCHOR — area not found') })
</script>

<template>
  <div v-if="lga && scored" class="page">
    <div class="band-wrap">
      <AppHeader variant="band" back-to="/results" back-label="All areas" share-to="/share" />
    </div>

    <div class="body-grid">
      <section class="hero">
        <div class="rank-tag">Ranked {{ ordinal(scored.rank) }} of 79</div>
        <h1>{{ lga.lga_name }}</h1>
        <div class="meta">{{ lga.region }} &middot; {{ lga.population.toLocaleString() }} residents</div>

        <div class="afford-stat">
          <div class="afford-label">Rent affordability</div>
          <div class="afford-num">About {{ oneIn(lga.affordability_pct_latest) }}</div>
          <div class="afford-body">
            rentals here were affordable on your income last quarter &mdash; that's
            {{ pctLabel(lga.affordability_pct_latest) }} of new lettings, {{ scored.rank === 1 ? 'the highest of any area on your list' : `ranked ${scored.rank} of 79 for affordability` }}.
          </div>
          <div class="afford-extra">
            <div>
              <div class="extra-k">5-year average</div>
              <div class="extra-v">{{ pctLabel(lga.affordability_pct_5yr_avg) }}</div>
            </div>
            <div>
              <div class="extra-k">Steadiness</div>
              <div class="extra-v">{{ stabilityWord(lga.affordability_pct_5yr_stddev) }}</div>
            </div>
            <div class="desktop-only-inline">
              <div class="extra-k">Total score</div>
              <div class="extra-v">{{ scored.scores.total.toFixed(1) }} / 10</div>
            </div>
          </div>
        </div>
      </section>

      <section class="chart-section">
        <div class="chart-title">Affordable rentals, last five years</div>
        <div class="chart-desc">Share of new lettings affordable on your income, each quarter.</div>
        <AffordabilityChart :series="lga.affordability_series_5yr" />
        <div class="chart-note">
          {{
            lga.affordability_pct_latest < lga.affordability_pct_5yr_avg
              ? `Down from around ${pctLabel(lga.affordability_pct_5yr_avg)} on average to ${pctLabel(lga.affordability_pct_latest)} now.`
              : `Up from around ${pctLabel(lga.affordability_pct_5yr_avg)} on average to ${pctLabel(lga.affordability_pct_latest)} now.`
          }}
        </div>
      </section>

      <section class="breakdown">
        <div class="section-title">What makes up the score</div>
        <div class="breakdown-list">
          <ScoreBar
            tone="affordability"
            label="Rent affordability"
            :value="scored.scores.affordability"
            :sublabel="`${pctLabel(lga.affordability_pct_latest)} of new rentals · half of the total score`"
          />
          <ScoreBar
            label="Schools"
            :value="scored.scores.schools"
            :sublabel="`${lga.school_count} open schools`"
          />
          <ScoreBar
            label="Public transport"
            :value="scored.scores.transport"
            :sublabel="`${lga.train_station_count} train stations`"
          />
          <ScoreBar
            label="Bulk-billing doctors"
            :value="scored.scores.gp_access"
            :sublabel="`${Math.round(lga.gp_bulk_billing_rate * 100)}% of GP visits are bulk-billed`"
          />
          <MissingDataCard
            v-if="lga.open_space_count == null"
            label="Parks and open space"
            note="We don't have parks data for this area &mdash; the source only covers metro Melbourne. This factor was left out of the score rather than counted as zero."
          />
          <MissingDataCard
            v-if="lga.sports_facility_count == null"
            label="Sports facilities"
            note="Same source, same gap. Not counted in the score."
          />
        </div>
      </section>

      <section v-if="currentLga && currentScored" id="table" class="compare">
        <div class="compare-head">
          <div class="section-title">Compared with {{ currentLga.lga_name }}, where you live now</div>
          <div class="view-toggle desktop-only-inline">
            <button type="button" :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'">Table</button>
            <button type="button" :class="{ active: viewMode === 'bars' }" @click="viewMode = 'bars'">Bars</button>
          </div>
        </div>

        <div class="compare-rows" :class="{ 'table-hidden': viewMode === 'table' }">
          <div v-for="row in comparisonRows" :key="row.label" class="compare-row">
            <span class="compare-label">{{ row.label }}</span>
            <span class="compare-value">
              {{ row.target }}<br /><span class="compare-secondary">{{ row.current }}</span>
            </span>
          </div>
        </div>

        <div class="compare-table-wrap" :class="{ 'table-hidden': viewMode === 'bars' }">
          <table>
            <thead>
              <tr>
                <th scope="col">Measure</th>
                <th scope="col" class="right">{{ lga.lga_name }}</th>
                <th scope="col" class="right">{{ currentLga.lga_name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in comparisonRows" :key="row.label">
                <th scope="row">{{ row.label }}</th>
                <td class="right">{{ row.target }}</td>
                <td class="right">{{ row.current }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="footer-note">
        <p>
          Rankings are a suggestion based on public data. They can't account for your job, your family or your
          support network.
        </p>
      </section>
    </div>
  </div>
  <div v-else class="page not-found">
    <div class="band-wrap"><AppHeader variant="band" back-to="/results" back-label="All areas" /></div>
    <div class="not-found-body">
      <h1>We can't find that area</h1>
      <p>The link may be out of date. <NuxtLink to="/results">Go back to your results.</NuxtLink></p>
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

.body-grid {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.hero {
  padding: 26px 24px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.rank-tag {
  font: 500 15px/1 var(--font-mono);
  color: var(--accent);
  margin-bottom: 10px;
}

h1 {
  margin: 0 0 6px;
  font: 600 32px/1.15 var(--font-sans);
  color: var(--ink);
  letter-spacing: -0.02em;
}

.meta {
  font: 400 16px/1.4 var(--font-sans);
  color: var(--body);
  margin-bottom: 24px;
}

.afford-label {
  font: 500 13px/1 var(--font-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 14px;
}

.afford-num {
  font: 600 48px/1 var(--font-sans);
  color: var(--ink);
  letter-spacing: -0.03em;
  margin-bottom: 10px;
}

.afford-body {
  font: 400 18px/1.5 var(--font-sans);
  color: var(--body);
  margin-bottom: 18px;
}

.afford-extra {
  display: flex;
  gap: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--border-hairline);
}

.extra-k {
  font: 400 14px/1.3 var(--font-mono);
  color: var(--muted);
  margin-bottom: 6px;
}

.extra-v {
  font: 600 21px/1 var(--font-sans);
  color: var(--ink);
}

.desktop-only-inline {
  display: none;
}

.chart-section {
  padding: 26px 24px 24px;
  border-bottom: 1px solid var(--border);
}

.chart-title {
  font: 600 21px/1.3 var(--font-sans);
  color: var(--ink);
  margin-bottom: 4px;
}

.chart-desc {
  font: 400 16px/1.45 var(--font-sans);
  color: var(--body);
  margin-bottom: 18px;
}

.chart-note {
  margin-top: 14px;
  font: 400 15px/1.5 var(--font-sans);
  color: var(--body);
}

.breakdown {
  padding: 26px 24px;
  border-bottom: 1px solid var(--border);
}

.section-title {
  font: 600 21px/1.3 var(--font-sans);
  color: var(--ink);
  margin-bottom: 18px;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.compare {
  padding: 24px;
  background: var(--surface-info);
  border-bottom: 1px solid var(--border);
}

.compare-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.compare-rows {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font: 400 17px/1.4 var(--font-sans);
}

.compare-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-hairline);
}

.compare-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.compare-label {
  color: var(--body);
}

.compare-value {
  color: var(--ink);
  font-weight: 600;
  text-align: right;
}

.compare-secondary {
  font-weight: 400;
  color: var(--muted);
}

.compare-table-wrap {
  display: none;
}

.view-toggle {
  display: none;
}

.footer-note {
  padding: 24px;
  font: 400 15px/1.5 var(--font-sans);
  color: var(--muted);
}

.footer-note p {
  margin: 0;
}

.not-found-body {
  max-width: 560px;
  margin: 0 auto;
  padding: 40px 24px;
}

@media (min-width: 860px) {
  .body-grid {
    padding-bottom: 20px;
  }

  .hero {
    padding: 34px 40px 30px;
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: 56px;
  }

  .chart-section,
  .breakdown,
  .compare {
    padding-left: 40px;
    padding-right: 40px;
  }

  .desktop-only-inline {
    display: block;
  }

  .afford-num {
    font-size: 52px;
  }

  .afford-body {
    max-width: 40ch;
  }

  .breakdown {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 56px;
    border-bottom: none;
  }

  .breakdown .section-title {
    grid-column: 1;
  }

  .breakdown-list {
    grid-column: 1;
  }

  .view-toggle {
    display: flex;
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    overflow: hidden;
  }

  .view-toggle button {
    min-height: 44px;
    padding: 0 16px;
    border: none;
    background: var(--surface-2);
    color: var(--body);
    font: 500 15px/1 var(--font-sans);
    cursor: pointer;
  }

  .view-toggle button.active {
    background: var(--header-band);
    color: var(--header-band-text);
  }

  .compare-table-wrap.table-hidden,
  .compare-rows.table-hidden {
    display: none;
  }

  .compare-table-wrap {
    display: block;
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font: 400 16px/1.4 var(--font-sans);
  }

  th,
  td {
    padding: 13px 12px 13px 0;
    border-top: 1px solid var(--border-hairline);
    color: var(--ink);
    font-weight: 400;
    text-align: left;
    font-family: var(--font-mono);
  }

  thead th {
    border-top: none;
    font: 500 12px/1 var(--font-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    font-family: var(--font-mono);
  }

  th[scope='row'] {
    color: var(--body);
    font-family: var(--font-sans);
  }

  .right {
    text-align: right;
  }
}
</style>
