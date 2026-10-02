<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { lettingsLabel, ordinal, stationLabel } from '~/composables/useScoring'
import {
  areaSeries,
  BEDROOM_FILTERS,
  lastYears,
  loadAffordabilitySeries,
  recentSentence,
  THIN_QUARTER,
  trendOver,
  typicalLettings,
  windowSentence,
  type BedroomKey
} from '~/composables/useAffordabilitySeries'
import { regionLabel } from '~/composables/useLgaData'
import { orderedLgaTabs, type LgaTabKey } from '~/composables/useLgaTabs'
import { SCHOOL_LEVELS, SCHOOL_SECTORS, type SchoolLevel, type SchoolSector } from '~/data/options'
import { summariseAedc } from '~/composables/useAedc'
import { overWholeIncomeNote, weekStrip } from '~/composables/useWeekStrip'
import { bandsFrom, guidebookCards } from '~/composables/useGuidebook'

definePageMeta({ layout: 'results' })

useFragmentSync()

const route = useRoute()
const { answers, scored, bedrooms, schoolsApply, schoolFilter } = useResults()
const { meta, all } = useLgaData()

// Where each area sits against the rest, worked out once rather than per card.
const bands = bandsFrom(all)
const strip = computed(() => weekStrip(area.value?.rentSharePct))
const overIncome = computed(() => overWholeIncomeNote(area.value?.rentSharePct))
const cards = computed(() =>
  area.value
    ? guidebookCards(area.value, { bands, bedrooms: bedrooms.value, schoolFilter: schoolFilter.value })
    : []
)

const code = computed(() => Number(route.params.lga))
const area = computed(() => scored.value.find((s) => s.lga_code === code.value))

// The series is a separate chunk, so the questionnaire pages never pay for it. If it fails to
// load the chart stays away; the wording around it does not depend on the file.
const seriesFile = ref<Awaited<ReturnType<typeof loadAffordabilitySeries>> | null>(null)
watch(
  code,
  async (value) => {
    if (!Number.isFinite(value)) return
    try {
      seriesFile.value = await loadAffordabilitySeries()
    } catch {
      seriesFile.value = null
    }
  },
  { immediate: true }
)

const bedroomFilter = ref<BedroomKey>('all')
const rangeFilter = ref('all')

const bedroomOptions = BEDROOM_FILTERS.map((f) => ({ value: f.key, label: f.label }))
const rangeOptions = [
  { value: 'all', label: 'All years' },
  { value: '10', label: '10 years' },
  { value: '5', label: '5 years' }
]

const rangeYears = computed(() => (rangeFilter.value === 'all' ? null : Number(rangeFilter.value)))
/** True while the chart shows what the precomputed headline figures describe. */
const chartAtDefaults = computed(() => bedroomFilter.value === 'all' && rangeYears.value === null)

const series = computed(() =>
  seriesFile.value ? areaSeries(seriesFile.value, code.value, bedroomFilter.value) : null
)
const shownSeries = computed(() => (series.value ? lastYears(series.value, rangeYears.value) : null))

// Built at build time, so the wording is on the page from the first paint. The series below is
// only what the chart draws.
const history = computed(() => area.value?.affordability_history ?? null)

const currentArea = computed(() =>
  answers.value.currentLga != null && answers.value.currentLga !== code.value
    ? scored.value.find((s) => s.lga_code === answers.value.currentLga)
    : undefined
)

const gpPct = (rate: number) => Math.round(rate * 100)

// Both ends of each window are an average across a year, so one noisy quarter in a small area
// cannot flip the direction the sentence claims.
const headlineFigures = computed(() => {
  const h = history.value
  return h ? { from: h.from, to: h.to, fromYear: h.from_year, toYear: h.to_year } : null
})

/** The area's headline trend: all bedrooms, the whole run. Never changes with the chart filters. */
const trendSentence = computed(() => (headlineFigures.value ? windowSentence(headlineFigures.value) : ''))

const recentTrendSentence = computed(() => {
  const h = history.value
  if (!h || !headlineFigures.value) return ''
  return recentSentence(headlineFigures.value, h.recent_from, h.recent_year, h.recent_years)
})

/**
 * The caption under the chart describes what is actually plotted. At the default view that is the
 * headline figures, which are already on the page before the series file arrives; once a filter is
 * on it is worked out from the window being shown, so the words and the line always agree.
 */
const chartSentence = computed(() => {
  if (chartAtDefaults.value) return trendSentence.value
  return shownSeries.value ? windowSentence(trendOver(shownSeries.value)) : ''
})

const chartRecentSentence = computed(() => (chartAtDefaults.value ? recentTrendSentence.value : ''))

/**
 * How many rentals a quarter the shown window rests on, and whether that is too few to draw.
 * A share of two rentals swings fifty points when one of them changes, so those windows get the
 * number stated instead of a line implying a trend.
 */
const shownLettings = computed(() => (shownSeries.value ? typicalLettings(shownSeries.value) : null))
const tooThinToChart = computed(() => {
  const lettings = shownLettings.value
  return lettings !== null && lettings < THIN_QUARTER
})

const thinNote = computed(() => {
  if (!tooThinToChart.value) return ''
  const lettings = Math.max(1, Math.round(shownLettings.value ?? 0))
  // "4 bed" is the chip's label; the sentence needs "4-bedroom", and it has to agree in number.
  const beds = bedroomFilter.value.startsWith('br') ? Number(bedroomFilter.value.slice(2)) : null
  const one = lettings === 1
  const kind = beds ? `${beds}-bedroom ${one ? 'home' : 'homes'}` : one ? 'home' : 'homes'
  const count = one ? 'about one' : `about ${lettings}`
  return `Only ${count} ${kind} ${one ? 'is' : 'are'} leased here each quarter. That is too few to draw a fair trend, so we have left the chart out.`
})

const bedroomLabel = computed(
  () => bedroomOptions.find((o) => o.value === bedroomFilter.value)?.label ?? 'All'
)

/** Names the slice on screen, so a filtered chart is never mistaken for the headline. */
const chartScope = computed(() => {
  if (chartAtDefaults.value) return ''
  const size = bedroomLabel.value === 'All' ? 'All sizes' : `${bedroomLabel.value} homes`
  const span = rangeYears.value === null ? 'since 2000' : `last ${rangeYears.value} years`
  return `${size} · ${span}`
})

const comparison = computed(() => {
  const a = area.value
  const c = currentArea.value
  if (!a || !c) return []
  return [
    { label: 'Rank', a: ordinal(a.rank), b: ordinal(c.rank) },
    {
      label: `Typical ${bedrooms.value}-bedroom rent`,
      a: a.rentPerWeek ? `$${a.rentPerWeek} a week` : 'No data',
      b: c.rentPerWeek ? `$${c.rentPerWeek} a week` : 'No data'
    },
    {
      label: 'Share of your income',
      a: a.rentSharePct != null ? `${a.rentSharePct}%` : 'No data',
      b: c.rentSharePct != null ? `${c.rentSharePct}%` : 'No data'
    },
    { label: 'Schools', a: String(a.school_count), b: String(c.school_count) },
    { label: 'Train stations', a: String(a.station_count), b: String(c.station_count) },
    { label: 'GP visits bulk-billed', a: `${gpPct(a.bulk_billing_rate)}%`, b: `${gpPct(c.bulk_billing_rate)}%` }
  ]
})

// Overview always leads; the rest follow what the user said matters.
const tabs = computed(() => orderedLgaTabs(answers.value.weights))
const activeTab = ref<LgaTabKey>('overview')

// Information, not ranking: the team agreed early that this describes how children in an area
// are doing and must not feed the score.
const aedc = computed(() => summariseAedc(area.value?.aedc))

/** Typical weekly rents, with the size the ranking actually used marked. */
const rentRows = computed(() => {
  const a = area.value
  if (!a) return []
  const scoredSize = bedrooms.value
  return [
    { label: '1-bedroom flat', value: a.rent.flat_1br, counts: scoredSize === 1 },
    { label: '2-bedroom flat', value: a.rent.flat_2br, counts: scoredSize === 2 },
    { label: '2-bedroom house', value: a.rent.house_2br, counts: scoredSize === 2 },
    { label: '3-bedroom house', value: a.rent.house_3br, counts: scoredSize === 3 }
  ]
})

/** The sports with the most places to play, longest list first. */
const topSports = computed(() => {
  const a = area.value
  if (!a) return []
  return Object.entries(a.sports)
    .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))
    .map(([name, facilities]) => ({ name, facilities }))
})

const SPORTS_SHOWN = 8
const showAllSports = ref(false)
const sportsList = computed(() => (showAllSports.value ? topSports.value : topSports.value.slice(0, SPORTS_SHOWN)))

/**
 * The schools table: three rows of kind against two columns of level.
 *
 * The cells matching the schools step are marked, so the page still reflects what the household
 * said without asking them to operate a filter that only ever moved one number.
 */
const chosenLevels = computed(() => (schoolsApply.value ? answers.value.schools.levels : []))
const chosenSectors = computed(() => (schoolsApply.value ? answers.value.schools.sectors : []))

const schoolSectorRows = computed(() => {
  const a = area.value
  if (!a) return []
  return SCHOOL_SECTORS.map((sector) => ({
    key: sector.value,
    label: sector.label,
    cells: SCHOOL_LEVELS.map((level) => ({
      key: `${level.value}-${sector.value}`,
      count: a.schools[level.value][sector.value],
      chosen: chosenLevels.value.includes(level.value) && chosenSectors.value.includes(sector.value)
    }))
  }))
})

const chosenSchoolsNote = computed(() => {
  if (!schoolsApply.value) return ''
  const levels = SCHOOL_LEVELS.filter((l) => chosenLevels.value.includes(l.value)).map((l) => l.label.toLowerCase())
  const sectors = SCHOOL_SECTORS.filter((x) => chosenSectors.value.includes(x.value)).map((x) => x.label.toLowerCase())
  if (!levels.length || !sectors.length) return ''
  const list = (parts: string[]) =>
    parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0]
  return `Highlighted: ${list(sectors)} ${list(levels)}, the kinds you told us about.`
})

/** Schools split by level. The two lists overlap, so they are never added together. */
const schoolLevels = computed(() => {
  const a = area.value
  if (!a) return []
  return [
    { key: 'primary' as SchoolLevel, level: 'Primary', sectors: a.schools.primary },
    { key: 'secondary' as SchoolLevel, level: 'High school', sectors: a.schools.secondary }
  ].map((row) => ({
    ...row,
    total: row.sectors.government + row.sectors.catholic + row.sectors.independent
  }))
})

useHead({ title: () => area.value?.lga_name ?? 'Area not found' })
</script>

<template>
  <div v-if="area" class="max-w-[960px] mx-auto">
    <!-- The arrival band. Terracotta here and navy on the list, so stepping into an area is a
         visible change of place rather than another row. -->
    <section class="on-accent relative overflow-hidden bg-accent pt-1 pb-[52px] px-4 dt:px-10">
      <LogoMark
        :size="300"
        class="pointer-events-none absolute -right-16 -top-10 text-accent-band-mark opacity-60"
      />
      <div class="relative">
        <NuxtLink
          to="/results"
          class="inline-flex items-center gap-2 min-h-11 font-sans font-medium text-[15px] text-accent-band-body no-underline"
        >
          <ArrowLeft :size="18" aria-hidden="true" />
          All areas
        </NuxtLink>

        <div
          class="mt-2 mb-3 inline-flex items-center min-h-8 py-[6px] px-[14px] rounded-full border bg-accent-band-chip border-accent-band-chip-border font-sans font-medium text-[14px] leading-none text-accent-band-chip-text"
        >
          {{ ordinal(area.rank) }} of 79 areas for you
        </div>

        <h1 class="m-0 mb-[6px] display-area text-accent-on">{{ area.lga_name }}</h1>
        <p class="m-0 font-sans text-[17px] leading-[1.4] text-accent-band-body">
          {{ area.area }} · {{ regionLabel(area.region) }}
        </p>
      </div>
    </section>

    <!-- Lifted over the band's lower edge, so the number you came for sits across the join. -->
    <section class="px-4 dt:px-10">
      <div
        class="-mt-10 dt:-mt-[72px] p-5 dt:p-7 rounded-[18px] bg-surface border border-line shadow-[0_1px_0_var(--border),0_12px_26px_rgba(27,42,58,0.12)]"
      >
        <template v-if="area.rentSharePct != null">
          <div class="figure font-semibold text-[50px] leading-none text-ink tracking-[-0.03em]">
            {{ area.rentSharePct }}%
          </div>
          <p class="m-0 mt-1 font-sans text-[17px] leading-[1.5] text-body">
            of your income on rent. A typical {{ bedrooms }}-bedroom home here is
            ${{ area.rentPerWeek }} a week.
            {{
              area.band === 'within'
                ? "That's within the 30% usually counted as affordable."
                : "That's more than the 30% usually counted as affordable."
            }}
          </p>

          <!-- Rent as days of the week. The sentences say the same thing as the bars, so the
               picture is never the only way to get it. -->
          <div v-if="strip" class="mt-5 p-4 rounded-[14px] bg-bg border border-line-soft">
            <div class="flex items-end gap-[6px] h-[52px] dt:h-[62px]" role="img" :aria-label="strip.label">
              <div
                v-for="bar in strip.bars"
                :key="bar.day"
                class="flex-1 h-full rounded-[7px] bg-border overflow-hidden flex flex-col justify-end"
              >
                <div class="w-full rounded-[7px] bg-accent" :style="{ height: `${bar.fill * 100}%` }" />
              </div>
            </div>
            <div class="mt-2 flex gap-[6px]" aria-hidden="true">
              <div
                v-for="bar in strip.bars"
                :key="bar.day"
                class="flex-1 text-center font-sans text-[12px] leading-none text-muted"
              >
                {{ bar.day.charAt(0) }}
              </div>
            </div>
            <p class="m-0 mt-3 font-sans font-semibold text-[16px] leading-[1.4] text-ink">
              {{ strip.headline }}
            </p>
            <p class="m-0 mt-1 font-sans text-[15px] leading-[1.45] text-body">{{ strip.body }}</p>
          </div>
          <p v-else-if="overIncome" class="m-0 mt-5 p-4 rounded-[14px] bg-banner-bg border border-banner-border font-sans text-[16px] leading-[1.45] text-banner-text">
            {{ overIncome }}
          </p>
        </template>
        <template v-else>
          <p class="m-0 font-sans text-[17px] leading-[1.5] text-body">
            Not enough {{ bedrooms }}-bedroom homes are rented here for a typical rent to be
            published, so we can't say how much of your income one would take.
          </p>
        </template>

        <div class="mt-5 pt-[18px] border-t border-line-soft">
          <div class="font-sans text-[15px] leading-[1.35] text-muted mb-[6px]">
            New leases affordable on a Centrelink income, last quarter
          </div>
          <div class="font-sans font-semibold text-[21px] leading-none text-ink">
            {{ lettingsLabel(area.affordable_lettings_pct) }}
          </div>
          <p v-if="trendSentence" class="m-0 mt-2 font-sans text-[16px] leading-[1.45] text-body">
            {{ trendSentence }}
            <button
              type="button"
              class="inline-flex items-center min-h-11 border-none bg-transparent p-0 font-sans text-[16px] text-accent underline cursor-pointer"
              @click="activeTab = 'rent'"
            >
              See the full trend
            </button>
          </p>
        </div>
      </div>
    </section>

    <LgaTabs v-model="activeTab" :tabs="tabs" />

    <!-- Every panel stays in the page and is hidden with display, so each tab's aria-controls
         always points at something real and the chart keeps its measured width. -->
    <div
      v-show="activeTab === 'overview'"
      id="lga-panel-overview"
      role="tabpanel"
      aria-labelledby="lga-tab-overview"
      tabindex="0"
    >
      <section class="py-[26px] px-4 dt:px-10">
        <h2 class="m-0 mb-[18px] heading-section">What it's like here</h2>
        <!-- One card per scored factor: the number, how it compares, and a line built from the
             raw value so the sentence can never disagree with the bar above it. -->
        <div class="grid grid-cols-2 gap-3 dt:grid-cols-4 dt:gap-4">
          <div
            v-for="card in cards"
            :key="card.key"
            class="p-4 rounded-[16px] bg-surface-2 border border-line flex flex-col"
          >
            <div class="font-sans font-medium text-[15px] leading-[1.3] text-body">{{ card.label }}</div>
            <div class="mt-2 figure font-semibold text-[34px] leading-none text-ink">
              <template v-if="card.score == null">&mdash;</template>
              <template v-else>{{ card.score.toFixed(1) }}</template>
              <span v-if="card.score != null" class="font-sans font-normal text-[14px] text-body"> out of 10</span>
            </div>
            <div class="mt-3 h-2 rounded-full bg-line overflow-hidden">
              <div
                v-if="card.score != null"
                class="h-full rounded-full bg-data-main"
                :style="{ width: `${Math.min(100, Math.max(0, (card.score / 10) * 100))}%` }"
              />
            </div>
            <p class="m-0 mt-3 font-sans text-[15px] leading-[1.45] text-body">{{ card.line }}</p>
          </div>
        </div>
      </section>

      <section v-if="aedc" class="py-[26px] px-4 dt:px-10 border-b border-line">
        <div class="font-sans font-medium text-[14px] leading-none text-muted mb-2">
          Not part of the ranking
        </div>
        <h2 class="m-0 mb-1 heading-section">
          How young children are doing here
        </h2>
        <p class="m-0 mb-[18px] font-sans text-[16px] leading-[1.45] text-body">{{ aedc.sentence }}</p>
        <AffordabilityChart
          :series="aedc.shares"
          :labels="aedc.years"
          :description="aedc.sentence"
          title="Children starting school who were assessed as needing extra support, by year"
        />
        <p class="m-0 mt-4 font-sans text-[15px] leading-[1.45] text-muted">
          From the Australian Early Development Census, which their teachers fill in every three
          years. It describes how children are doing, not how good the schools are.
          {{ aedc.cohortNote }}
        </p>
      </section>
    </div>

    <div
      v-show="activeTab === 'rent'"
      id="lga-panel-rent"
      role="tabpanel"
      aria-labelledby="lga-tab-rent"
      tabindex="0"
    >
      <section class="py-[26px] px-4 dt:px-10 border-b border-line">
        <h2 class="m-0 mb-1 heading-section">
          Share of new leases that were affordable
        </h2>
        <p v-if="chartScope" class="m-0 mb-1 font-sans font-medium text-[14px] leading-none text-accent">
          {{ chartScope }}
        </p>
        <p v-if="tooThinToChart" class="m-0 mb-[18px] font-sans text-[16px] leading-[1.45] text-body">
          {{ thinNote }}
        </p>
        <template v-else>
          <p class="m-0 mb-1 font-sans text-[16px] leading-[1.45] text-body">
            {{ chartSentence }} {{ chartRecentSentence }}
          </p>
          <p class="m-0 mb-[18px] font-sans text-[15px] leading-[1.45] text-muted">Each point is one quarter.</p>
        </template>

        <!-- Only the drawing waits for the quarterly series; everything around it is already
             here, and the box keeps its height so the page does not jump when the line lands. -->
        <div v-if="!tooThinToChart" class="min-h-[190px]">
          <AffordabilityChart
            v-if="shownSeries"
            :series="shownSeries.shares"
            :labels="shownSeries.quarters"
            :description="`${chartSentence} ${chartRecentSentence}`"
            :title="`Share of new leases that were affordable. ${chartScope || 'All sizes, since 2000'}.`"
          />
        </div>

        <div class="mt-5 flex flex-col gap-4 dt:flex-row dt:gap-8">
          <ChipGroup v-model="bedroomFilter" name="chart-bedrooms" label="Bedrooms" :options="bedroomOptions" />
          <ChipGroup v-model="rangeFilter" name="chart-range" label="Time" :options="rangeOptions" />
        </div>
        <p class="m-0 mt-4 font-sans text-[15px] leading-[1.45] text-muted">
          The bedroom filter is about the rentals counted here, not the size you told us about.
          There are too few one-bedroom rentals each quarter to chart.
        </p>
      </section>

      <section class="py-[26px] px-4 dt:px-10 border-b border-line">
        <h2 class="m-0 mb-[18px] heading-section">Typical weekly rent</h2>
        <dl class="m-0 flex flex-col gap-3">
          <div v-for="row in rentRows" :key="row.label" class="flex items-baseline justify-between gap-4">
            <dt class="font-sans text-[16px] leading-[1.4] text-body">
              {{ row.label }}
              <span v-if="row.counts" class="text-muted">· used for your ranking</span>
            </dt>
            <dd class="m-0 figure text-[17px] text-ink">
              {{ row.value != null ? `$${row.value}` : 'No data' }}
            </dd>
          </div>
        </dl>
        <p class="m-0 mt-4 font-sans text-[15px] leading-[1.45] text-muted">
          Medians for the {{ meta.rentQuarter }}. Sizes with too few rentals to publish show no data.
        </p>
      </section>
    </div>

    <div
      v-show="activeTab === 'schools'"
      id="lga-panel-schools"
      role="tabpanel"
      aria-labelledby="lga-tab-schools"
      tabindex="0"
    >
      <section class="py-[26px] px-4 dt:px-10 border-b border-line">
        <h2 class="m-0 mb-1 heading-section">Schools</h2>
        <p class="m-0 mb-5 font-sans text-[16px] leading-[1.45] text-body">
          {{ area.school_count }} schools in {{ area.lga_name }}, by level and kind.
        </p>

        <!-- A table rather than a filter: six numbers at once says more than one number that
             changes, and there is nothing to operate. -->
        <div class="overflow-x-auto">
          <table class="w-full border-collapse font-sans text-[16px] leading-[1.4]">
            <caption class="visually-hidden">
              Schools in {{ area.lga_name }} by level and kind
            </caption>
            <thead>
              <tr>
                <th scope="col" class="text-left py-2 pr-2 font-sans font-medium text-[14px] text-muted">
                  Kind
                </th>
                <th
                  v-for="level in schoolLevels"
                  :key="level.key"
                  scope="col"
                  class="text-right py-2 px-2 font-sans font-medium text-[14px] text-muted"
                >
                  {{ level.level }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sector in schoolSectorRows" :key="sector.key">
                <th scope="row" class="text-left py-[11px] pr-2 border-t border-line-soft font-sans font-normal text-body">
                  {{ sector.label }}
                </th>
                <td
                  v-for="cell in sector.cells"
                  :key="cell.key"
                  class="text-right py-[11px] px-2 border-t border-line-soft font-mono text-ink"
                  :class="cell.chosen ? 'bg-surface-accent-tint font-medium' : ''"
                >
                  {{ cell.count }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" class="text-left py-[11px] pr-2 border-t border-line font-sans font-medium text-ink">
                  All kinds
                </th>
                <td
                  v-for="level in schoolLevels"
                  :key="level.key"
                  class="text-right py-[11px] px-2 border-t border-line font-mono font-medium text-ink"
                >
                  {{ level.total }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p v-if="chosenSchoolsNote" class="m-0 mt-4 font-sans text-[15px] leading-[1.45] text-muted">
          {{ chosenSchoolsNote }}
        </p>
        <p class="m-0 mt-3 font-sans text-[15px] leading-[1.45] text-muted">
          A school that teaches both levels is counted in both columns, so the two columns add up to
          more than {{ area.school_count }}.
        </p>
      </section>
    </div>

    <div
      v-show="activeTab === 'sport'"
      id="lga-panel-sport"
      role="tabpanel"
      aria-labelledby="lga-tab-sport"
      tabindex="0"
    >
      <section class="py-[26px] px-4 dt:px-10 border-b border-line">
        <h2 class="m-0 mb-1 heading-section">Sport and open space</h2>
        <p class="m-0 mb-[18px] font-sans text-[16px] leading-[1.45] text-body">
          {{ area.sport_variety }} kinds of sport have somewhere to play here, and parks cover
          {{ area.green_space_pct }}% of the area.
        </p>
        <dl class="m-0 flex flex-col gap-2">
          <div v-for="sport in sportsList" :key="sport.name" class="flex items-baseline justify-between gap-4">
            <dt class="font-sans text-[16px] leading-[1.4] text-body">{{ sport.name }}</dt>
            <dd class="m-0 figure text-[17px] text-ink">{{ sport.facilities }}</dd>
          </div>
        </dl>
        <button
          v-if="topSports.length > SPORTS_SHOWN"
          type="button"
          class="btn-secondary mt-5"
          @click="showAllSports = !showAllSports"
        >
          {{ showAllSports ? 'Show fewer sports' : `Show all ${topSports.length} sports` }}
        </button>
        <p class="m-0 mt-5 font-sans text-[15px] leading-[1.45] text-muted">
          The number is how many places there are to play, not how many clubs or teams.
        </p>
      </section>
    </div>

    <div
      v-show="activeTab === 'transport'"
      id="lga-panel-transport"
      role="tabpanel"
      aria-labelledby="lga-tab-transport"
      tabindex="0"
    >
      <section class="py-[26px] px-4 dt:px-10 border-b border-line">
        <h2 class="m-0 mb-1 heading-section">Getting around</h2>
        <p class="m-0 mb-[18px] font-sans text-[16px] leading-[1.45] text-body">
          <template v-if="area.station_count > 0">
            {{ stationLabel(area.station_count) }} in {{ area.lga_name }}. That scores
            {{ area.ranks.transport.toFixed(1) }} out of 10 for train access, against the other 78 areas.
          </template>
          <template v-else>
            There's no train station in {{ area.lga_name }}, so without a car you'd be getting around
            by bus or coach. It's worth checking the routes near where you'd work or go to school.
          </template>
        </p>
        <div v-if="currentArea" class="pt-[18px] border-t border-line-soft">
          <div class="font-sans text-[14px] leading-[1.35] text-muted mb-[6px]">
            Where you live now, {{ currentArea.lga_name }}
          </div>
          <div class="font-sans text-[17px] leading-[1.4] text-ink">
            {{ stationLabel(currentArea.station_count) }}
          </div>
        </div>
      </section>
    </div>

    <section v-if="currentArea" v-show="activeTab === 'overview'" class="py-[26px] px-4 dt:px-10 bg-surface-info border-b border-line">
      <h2 class="m-0 mb-4 heading-section">
        Compared with {{ currentArea.lga_name }}, where you live now
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse font-sans text-[16px] leading-[1.4]">
          <thead>
            <tr>
              <th scope="col" class="text-left py-[10px] pr-2 font-mono font-medium text-[12px] tracking-[0.08em] uppercase text-muted">
                <span class="visually-hidden">Measure</span>
              </th>
              <th scope="col" class="text-right py-[10px] px-2 font-mono font-medium text-[12px] tracking-[0.08em] uppercase text-muted">
                {{ area.lga_name }}
              </th>
              <th scope="col" class="text-right py-[10px] pl-2 font-mono font-medium text-[12px] tracking-[0.08em] uppercase text-muted">
                {{ currentArea.lga_name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in comparison" :key="row.label">
              <th scope="row" class="text-left py-[12px] pr-2 border-t border-line-soft font-sans font-normal text-body">
                {{ row.label }}
              </th>
              <td class="text-right py-[12px] px-2 border-t border-line-soft font-mono text-ink">{{ row.a }}</td>
              <td class="text-right py-[12px] pl-2 border-t border-line-soft font-mono text-ink">{{ row.b }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>

  <div v-else class="max-w-[560px] mx-auto py-10 px-4 dt:px-6">
    <h1 class="m-0 mb-[6px] display-area">
      We can't find that area
    </h1>
    <p class="mb-6 font-sans text-[16px] leading-[1.4] text-body">The link may be out of date.</p>
    <NuxtLink to="/results" class="btn-primary">Back to results</NuxtLink>
  </div>
</template>
