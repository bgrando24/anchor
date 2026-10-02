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
import { schoolsMatching } from '~/composables/useScoring'
import { summariseAedc } from '~/composables/useAedc'

definePageMeta({ layout: 'results' })

useFragmentSync()

const route = useRoute()
const { answers, scored, bedrooms, schoolsApply, schoolFilter } = useResults()
const { meta } = useLgaData()

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

const breakdown = computed(() => {
  const a = area.value
  if (!a) return []
  return [
    {
      label: 'Rent',
      value: a.ranks.rent,
      sub: a.rentPerWeek ? `$${a.rentPerWeek} a week for ${bedrooms.value} bedrooms` : 'No rent data'
    },
    { label: 'Schools', value: a.ranks.schools, sub: `${a.school_count} schools` },
    { label: 'Train stations', value: a.ranks.transport, sub: stationLabel(a.station_count) },
    { label: 'Bulk-billing doctors', value: a.ranks.gp_access, sub: `${gpPct(a.bulk_billing_rate)}% of GP visits bulk-billed` }
  ]
})

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
 * The schools tab starts on whatever the questionnaire was told, so the first thing shown is the
 * kind of school this household actually asked about. Changing it here is a look at the area, not
 * a change of answer: the ranking keeps using what they said on the schools step.
 */
const tabLevels = ref<SchoolLevel[]>([])
const tabSectors = ref<SchoolSector[]>([])

watch(
  () => answers.value.schools,
  (schools) => {
    tabLevels.value = schools.levels.length ? [...schools.levels] : SCHOOL_LEVELS.map((l) => l.value)
    tabSectors.value = schools.sectors.length ? [...schools.sectors] : SCHOOL_SECTORS.map((s) => s.value)
  },
  { immediate: true, deep: true }
)

const levelOptions = SCHOOL_LEVELS.map((l) => ({ value: l.value, label: l.label }))
const sectorOptions = SCHOOL_SECTORS.map((s) => ({ value: s.value, label: s.label }))

/** Georgia's ask: lead with the number for the kinds they care about, not a bigger total. */
const schoolsShown = computed(() => {
  const a = area.value
  if (!a) return 0
  return schoolsMatching(a, { levels: tabLevels.value, sectors: tabSectors.value })
})

const tabFilterIsEverything = computed(
  () => tabLevels.value.length === SCHOOL_LEVELS.length && tabSectors.value.length === SCHOOL_SECTORS.length
)

/** True when the tab is showing something other than what the ranking used. */
const tabFilterChanged = computed(() => {
  const chosen = schoolFilter.value
  if (!chosen) return !tabFilterIsEverything.value
  const same = (a: string[], b: string[]) => a.length === b.length && a.every((v) => b.includes(v))
  return !(same(chosen.levels, tabLevels.value) && same(chosen.sectors, tabSectors.value))
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
    <div class="px-4 dt:px-10 pt-4">
      <NuxtLink to="/results" class="inline-flex items-center gap-2 min-h-11 font-sans font-medium text-[15px] text-body no-underline">
        <ArrowLeft :size="18" aria-hidden="true" />
        All areas
      </NuxtLink>
    </div>

    <section class="py-[22px] px-4 dt:px-10 bg-surface-2 border-b border-line">
      <div class="font-sans font-medium text-[15px] leading-none text-accent mb-[10px]">
        Ranked {{ ordinal(area.rank) }} of 79
      </div>
      <h1 class="m-0 mb-[6px] display-area">
        {{ area.lga_name }}
      </h1>
      <p class="m-0 mb-6 font-sans text-[16px] leading-[1.4] text-body">
        {{ area.area }} · {{ regionLabel(area.region) }}
      </p>

      <div v-if="area.rentSharePct != null" class="font-sans font-semibold text-[48px] leading-none text-ink tracking-[-0.03em] mb-[10px]">
        {{ area.rentSharePct }}%
      </div>
      <p class="m-0 font-sans text-[18px] leading-[1.5] text-body dt:max-w-[46ch]">
        <template v-if="area.rentSharePct != null">
          of your income for a typical {{ bedrooms }}-bedroom rent (${{ area.rentPerWeek }} a week).
          {{
            area.band === 'within'
              ? "That's within the 30% usually counted as affordable."
              : "That's more than the 30% usually counted as affordable."
          }}
        </template>
        <template v-else>
          Not enough {{ bedrooms }}-bedroom homes are rented here for a typical rent to be published,
          so we can't say how much of your income one would take.
        </template>
      </p>

      <div class="mt-[22px] pt-[18px] border-t border-line-soft">
        <div class="font-sans text-[14px] leading-[1.35] text-muted mb-[6px]">
          New leases affordable on a Centrelink income, last quarter
        </div>
        <div class="font-sans font-semibold text-[21px] leading-none text-ink">
          {{ lettingsLabel(area.affordable_lettings_pct) }}
        </div>
        <!-- The chart lives on the Rent tab; this says what it shows, so the trend is not
             hidden behind a click. -->
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
      <section class="py-[26px] px-4 dt:px-10 border-b border-line">
        <h2 class="m-0 mb-[18px] heading-section">How this area scored</h2>
        <div class="flex flex-col gap-5">
          <ScoreBar v-for="row in breakdown" :key="row.label" :label="row.label" :value="row.value" :sublabel="row.sub" />
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
        <!-- The big number is for the kinds chosen, not every school, so it answers the question
             the reader actually asked. -->
        <div class="font-sans font-semibold text-[40px] leading-none text-ink tracking-[-0.02em] mb-[6px]">
          {{ schoolsShown }}
        </div>
        <p class="m-0 mb-4 font-sans text-[16px] leading-[1.45] text-body">
          <template v-if="tabFilterIsEverything">schools in {{ area.lga_name }}.</template>
          <template v-else>
            of the {{ area.school_count }} schools in {{ area.lga_name }} are the kind you picked.
          </template>
        </p>
        <p
          v-if="schoolsApply && !tabFilterChanged"
          class="m-0 mb-4 font-sans text-[15px] leading-[1.45] text-muted"
        >
          Showing what you told us on the schools step. Change it below to look around.
        </p>
        <p v-else-if="tabFilterChanged" class="m-0 mb-4 font-sans text-[15px] leading-[1.45] text-muted">
          This is just a different view of the area. Your ranking still uses what you told us.
        </p>

        <div class="mb-6 flex flex-col gap-4 dt:flex-row dt:gap-8">
          <CheckboxGroup
            v-model="tabLevels"
            name="tab-school-levels"
            legend="Level"
            show-legend
            :options="levelOptions"
          />
          <CheckboxGroup
            v-model="tabSectors"
            name="tab-school-sectors"
            legend="Kind of school"
            show-legend
            :options="sectorOptions"
          />
        </div>

        <h3 class="m-0 mb-3 heading-sub">
          Every school in {{ area.lga_name }}
        </h3>
        <div class="flex flex-col gap-5">
          <div v-for="level in schoolLevels" :key="level.level">
            <h4 class="m-0 mb-2 font-sans font-semibold text-[17px] leading-[1.3] text-ink">
              {{ level.level }} · {{ level.total }}
            </h4>
            <dl class="m-0 flex flex-col gap-2">
              <div class="flex items-baseline justify-between gap-4">
                <dt class="font-sans text-[16px] text-body">Government</dt>
                <dd class="m-0 figure text-[17px] text-ink">{{ level.sectors.government }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-4">
                <dt class="font-sans text-[16px] text-body">Catholic</dt>
                <dd class="m-0 figure text-[17px] text-ink">{{ level.sectors.catholic }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-4">
                <dt class="font-sans text-[16px] text-body">Independent</dt>
                <dd class="m-0 figure text-[17px] text-ink">{{ level.sectors.independent }}</dd>
              </div>
            </dl>
          </div>
        </div>
        <p class="m-0 mt-5 font-sans text-[15px] leading-[1.45] text-muted">
          A school that teaches both levels is counted in both lists, so the two totals add up to
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
