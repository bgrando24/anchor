<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { lettingsLabel, ordinal, stationLabel } from '~/composables/useScoring'
import { areaSeries, loadAffordabilitySeries, trendWord, type AreaSeries } from '~/composables/useAffordabilitySeries'
import { regionLabel } from '~/composables/useLgaData'
import { orderedLgaTabs, type LgaTabKey } from '~/composables/useLgaTabs'

definePageMeta({ layout: 'results' })

useFragmentSync()

const route = useRoute()
const { answers, scored, bedrooms } = useResults()
const { meta } = useLgaData()

const code = computed(() => Number(route.params.lga))
const area = computed(() => scored.value.find((s) => s.lga_code === code.value))

// The series is a separate chunk, so the questionnaire pages never pay for it. If it fails to
// load the section just stays away; the rest of the page does not depend on it.
const series = ref<AreaSeries | null>(null)
watch(
  code,
  async (value) => {
    if (!Number.isFinite(value)) return
    try {
      series.value = areaSeries(await loadAffordabilitySeries(), value)
    } catch {
      series.value = null
    }
  },
  { immediate: true }
)

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
/** Always one decimal, so 4 does not read as "4%" alongside "50.2%". */
const share = (value: number) => `${value.toFixed(1)}%`

const trendSentence = computed(() => {
  const h = history.value
  if (!h) return ''
  // "Stayed about the same" would claim a flat line; this window only compares its two ends, and
  // an area like Ballarat dipped by thirty points in between before coming back.
  if (trendWord(h.from, h.to) === 'stayed about the same') {
    return `It is about where it was in ${h.from_year}, near ${share(h.to)}.`
  }
  return `It ${trendWord(h.from, h.to)} from about ${share(h.from)} in ${h.from_year} to ${share(h.to)} in ${h.to_year}.`
})

// The long run says what has happened; this says whether it is still happening. Both windows are
// named, because "the trend" on its own invites the reader to assume the other one.
const recentSentence = computed(() => {
  const h = history.value
  if (!h) return ''
  const long = trendWord(h.from, h.to)
  const recent = trendWord(h.recent_from, h.to)
  if (recent === 'stayed about the same') {
    // Nothing to add when the long run was flat too; it would just say "near" twice.
    if (long === 'stayed about the same') return ''
    return `Over the last ${h.recent_years} years it has held near ${share(h.to)}.`
  }
  const turn = recent !== long && long !== 'stayed about the same' ? ', against the longer trend' : ''
  return `Over the last ${h.recent_years} years it ${recent}${turn}, from about ${share(h.recent_from)} in ${h.recent_year}.`
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

/** Schools split by level. The two lists overlap, so they are never added together. */
const schoolLevels = computed(() => {
  const a = area.value
  if (!a) return []
  return [
    { level: 'Primary', sectors: a.schools.primary },
    { level: 'Secondary', sectors: a.schools.secondary }
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
      <div class="font-mono font-medium text-[15px] leading-none text-accent mb-[10px]">
        Ranked {{ ordinal(area.rank) }} of 79
      </div>
      <h1 class="m-0 mb-[6px] font-sans font-semibold text-[32px] leading-[1.15] text-ink tracking-[-0.02em]">
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
        <template v-else>We don't have a typical rent for {{ bedrooms }}-bedroom homes here.</template>
      </p>

      <div class="mt-[22px] pt-[18px] border-t border-line-soft">
        <div class="font-mono text-[14px] leading-[1.35] text-muted mb-[6px]">
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
        <h2 class="m-0 mb-[18px] font-sans font-semibold text-[21px] leading-[1.3] text-ink">How this area scored</h2>
        <div class="flex flex-col gap-5">
          <ScoreBar v-for="row in breakdown" :key="row.label" :label="row.label" :value="row.value" :sublabel="row.sub" />
        </div>
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
        <h2 class="m-0 mb-1 font-sans font-semibold text-[21px] leading-[1.3] text-ink">
          Share of new leases that were affordable
        </h2>
        <p class="m-0 mb-1 font-sans text-[16px] leading-[1.45] text-body">
          {{ trendSentence }} {{ recentSentence }}
        </p>
        <p class="m-0 mb-[18px] font-sans text-[15px] leading-[1.45] text-muted">Each point is one quarter.</p>
        <!-- Only the drawing waits for the quarterly series; the wording above is already here. -->
        <AffordabilityChart
          v-if="series"
          :series="series.shares"
          :labels="series.quarters"
          :description="`${trendSentence} ${recentSentence}`"
          title="Share of new leases that were affordable, every quarter since 2000"
        />
      </section>

      <section class="py-[26px] px-4 dt:px-10 border-b border-line">
        <h2 class="m-0 mb-[18px] font-sans font-semibold text-[21px] leading-[1.3] text-ink">Typical weekly rent</h2>
        <dl class="m-0 flex flex-col gap-3">
          <div v-for="row in rentRows" :key="row.label" class="flex items-baseline justify-between gap-4">
            <dt class="font-sans text-[16px] leading-[1.4] text-body">
              {{ row.label }}
              <span v-if="row.counts" class="text-muted">· used for your ranking</span>
            </dt>
            <dd class="m-0 font-mono text-[17px] text-ink">
              {{ row.value != null ? `$${row.value}` : 'No data' }}
            </dd>
          </div>
        </dl>
        <p class="m-0 mt-4 font-sans text-[15px] leading-[1.45] text-muted">
          Medians for the {{ meta.rentQuarter.toLowerCase() }}. Sizes with too few rentals to publish show no data.
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
        <h2 class="m-0 mb-1 font-sans font-semibold text-[21px] leading-[1.3] text-ink">Schools</h2>
        <p class="m-0 mb-[18px] font-sans text-[16px] leading-[1.45] text-body">
          {{ area.school_count }} schools in {{ area.lga_name }}.
        </p>
        <div class="flex flex-col gap-5">
          <div v-for="level in schoolLevels" :key="level.level">
            <h3 class="m-0 mb-2 font-sans font-semibold text-[17px] leading-[1.3] text-ink">
              {{ level.level }} · {{ level.total }}
            </h3>
            <dl class="m-0 flex flex-col gap-2">
              <div class="flex items-baseline justify-between gap-4">
                <dt class="font-sans text-[16px] text-body">Government</dt>
                <dd class="m-0 font-mono text-[17px] text-ink">{{ level.sectors.government }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-4">
                <dt class="font-sans text-[16px] text-body">Catholic</dt>
                <dd class="m-0 font-mono text-[17px] text-ink">{{ level.sectors.catholic }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-4">
                <dt class="font-sans text-[16px] text-body">Independent</dt>
                <dd class="m-0 font-mono text-[17px] text-ink">{{ level.sectors.independent }}</dd>
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
        <h2 class="m-0 mb-1 font-sans font-semibold text-[21px] leading-[1.3] text-ink">Sport and open space</h2>
        <p class="m-0 mb-[18px] font-sans text-[16px] leading-[1.45] text-body">
          {{ area.sport_variety }} kinds of sport have somewhere to play here, and parks cover
          {{ area.green_space_pct }}% of the area.
        </p>
        <dl class="m-0 flex flex-col gap-2">
          <div v-for="sport in sportsList" :key="sport.name" class="flex items-baseline justify-between gap-4">
            <dt class="font-sans text-[16px] leading-[1.4] text-body">{{ sport.name }}</dt>
            <dd class="m-0 font-mono text-[17px] text-ink">{{ sport.facilities }}</dd>
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
        <h2 class="m-0 mb-1 font-sans font-semibold text-[21px] leading-[1.3] text-ink">Getting around</h2>
        <p class="m-0 mb-[18px] font-sans text-[16px] leading-[1.45] text-body">
          <template v-if="area.station_count > 0">
            {{ stationLabel(area.station_count) }} in {{ area.lga_name }}. That scores
            {{ area.ranks.transport.toFixed(1) }} out of 10 for train access, against the other 78 areas.
          </template>
          <template v-else>
            No train stations in {{ area.lga_name }}. Getting around without a car would mean buses
            or coaches.
          </template>
        </p>
        <div v-if="currentArea" class="pt-[18px] border-t border-line-soft">
          <div class="font-mono text-[14px] leading-[1.35] text-muted mb-[6px]">
            Where you live now, {{ currentArea.lga_name }}
          </div>
          <div class="font-sans text-[17px] leading-[1.4] text-ink">
            {{ stationLabel(currentArea.station_count) }}
          </div>
        </div>
        <p class="m-0 mt-5 font-sans text-[15px] leading-[1.45] text-muted">
          Train stations only. We don't have bus or tram stops in the data yet.
        </p>
      </section>
    </div>

    <section v-if="currentArea" v-show="activeTab === 'overview'" class="py-[26px] px-4 dt:px-10 bg-surface-info border-b border-line">
      <h2 class="m-0 mb-4 font-sans font-semibold text-[21px] leading-[1.3] text-ink">
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
    <h1 class="m-0 mb-[6px] font-sans font-semibold text-[32px] leading-[1.15] text-ink tracking-[-0.02em]">
      We can't find that area
    </h1>
    <p class="mb-6 font-sans text-[16px] leading-[1.4] text-body">The link may be out of date.</p>
    <NuxtLink to="/results" class="btn-primary">Back to results</NuxtLink>
  </div>
</template>
