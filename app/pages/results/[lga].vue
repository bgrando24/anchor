<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { lettingsLabel, ordinal, stationLabel } from '~/composables/useScoring'

definePageMeta({ layout: 'results' })

useFragmentSync()

const route = useRoute()
const { answers, scored, bedrooms } = useResults()

const code = computed(() => Number(route.params.lga))
const area = computed(() => scored.value.find((s) => s.lga_code === code.value))

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
        {{ area.area }} · {{ area.region }} region
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
      </div>
    </section>

    <!-- Hidden until the data team supplies lettings_series_5yr; the component is ready for it. -->
    <section v-if="area.lettings_series_5yr" class="py-[26px] px-4 dt:px-10 border-b border-line">
      <h2 class="m-0 mb-1 font-sans font-semibold text-[21px] leading-[1.3] text-ink">
        Share of new leases that were affordable, last 5 years
      </h2>
      <p class="m-0 mb-[18px] font-sans text-[16px] leading-[1.45] text-body">Each point is one quarter.</p>
      <AffordabilityChart
        :series="area.lettings_series_5yr"
        title="Share of new leases that were affordable, last 5 years"
      />
    </section>

    <section class="py-[26px] px-4 dt:px-10 border-b border-line">
      <h2 class="m-0 mb-[18px] font-sans font-semibold text-[21px] leading-[1.3] text-ink">How this area scored</h2>
      <div class="flex flex-col gap-5">
        <ScoreBar v-for="row in breakdown" :key="row.label" :label="row.label" :value="row.value" :sublabel="row.sub" />
      </div>
    </section>

    <section v-if="currentArea" class="py-[26px] px-4 dt:px-10 bg-surface-info border-b border-line">
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
