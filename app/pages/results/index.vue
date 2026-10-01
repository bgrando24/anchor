<script setup lang="ts">
import { Pencil } from 'lucide-vue-next'
import { PAYMENT_TYPES, INCOME_BANDS, BEDROOM_OPTIONS } from '~/data/options'
import { BAND_ORDER, rowSentence, type Band } from '~/composables/useScoring'

definePageMeta({ layout: 'results' })
useHead({ title: '79 areas, ranked for you' })

useFragmentSync()

const { answers, scored, bedrooms } = useResults()
const { byCode } = useLgaData()

const hasAnswers = computed(() => answersComplete(answers.value))

const BAND_HEADINGS: Record<Band, { heading: string; note?: string }> = {
  within: { heading: 'Rent under 30% of your income', note: '30% or less is the usual measure of affordable rent.' },
  stretch: { heading: 'Rent 31% to 40% of your income' },
  hard: { heading: 'Rent 41% to 50% of your income' },
  out: { heading: 'Rent more than half your income' },
  nodata: {
    heading: 'No rent data for this home size',
    note: "Homes Victoria didn't publish a typical rent for these areas."
  }
}

const showAll = ref(false)
const tableView = ref(false)
const TOP_N = 10

const visible = computed(() => (showAll.value ? scored.value : scored.value.slice(0, TOP_N)))

/** The visible rows regrouped under their band heading, empty bands dropped. */
const bands = computed(() =>
  BAND_ORDER.map((band) => ({ band, ...BAND_HEADINGS[band], rows: visible.value.filter((r) => r.band === band) })).filter(
    (g) => g.rows.length
  )
)

const noneWithin = computed(() => hasAnswers.value && !scored.value.some((r) => r.band === 'within'))

const paymentLabel = computed(() => PAYMENT_TYPES.find((p) => p.value === answers.value.paymentType)?.label ?? null)
const incomeLabel = computed(() => INCOME_BANDS.find((b) => b.value === answers.value.incomeBand)?.label ?? null)
const bedroomLabel = computed(() => BEDROOM_OPTIONS.find((b) => b.value === answers.value.bedrooms)?.label ?? null)
const currentLgaName = computed(() => byCode(answers.value.currentLga)?.lga_name ?? null)

const answersSummary = computed(() =>
  [paymentLabel.value, bedroomLabel.value, currentLgaName.value ? `Lives in ${currentLgaName.value}` : null]
    .filter(Boolean)
    .join(' · ')
)

function isCurrent(code: number) {
  return answers.value.currentLga === code
}
</script>

<template>
  <div v-if="!hasAnswers" class="max-w-[560px] mx-auto px-4 dt:px-6 pt-10 pb-12 flex flex-col gap-4">
    <h1 class="m-0 font-sans font-semibold text-[30px] leading-[1.2] text-ink tracking-[-0.02em]">
      Answer a few questions first
    </h1>
    <p class="m-0 font-sans text-[17px] leading-[1.55] text-body">
      We need your payment, bedrooms and area to rank the areas for you.
    </p>
    <NuxtLink to="/income" class="btn-primary mt-2">Start</NuxtLink>
  </div>

  <template v-else>
    <div class="on-band bg-header-band text-header-band-text">
      <div
        class="max-w-[1280px] mx-auto px-4 dt:px-10 pb-[18px] dt:pb-[22px] flex flex-col gap-4 dt:flex-row dt:items-start dt:justify-between dt:gap-8"
      >
        <div class="flex flex-col gap-2 min-w-0">
          <h1 class="m-0 font-sans font-semibold text-[26px] leading-[1.25] tracking-[-0.01em]">
            79 areas, ranked for you
          </h1>
          <p class="m-0 font-sans text-[16px] leading-[1.5] text-header-band-body dt:max-w-[60ch]">
            Sorted by how much of your income the rent would take, then by what you said matters.
          </p>
          <p class="m-0 mt-1 font-sans text-[15px] leading-[1.4] text-header-band-body dt:hidden">
            {{ answersSummary }}
          </p>
        </div>
        <div class="flex flex-wrap gap-3 shrink-0">
          <NuxtLink
            to="/income"
            class="btn-secondary min-h-11 gap-2 bg-transparent border-header-chip-outline text-header-chip-text text-[15px] dt:hidden"
          >
            <Pencil :size="16" aria-hidden="true" />
            Change answers
          </NuxtLink>
          <NuxtLink
            to="/share"
            class="btn-secondary min-h-11 bg-transparent border-header-chip-outline text-header-chip-text text-[15px]"
          >
            Save or share
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="max-w-[1280px] mx-auto grid grid-cols-1 dt:grid-cols-[280px_minmax(0,1fr)]">
      <aside class="hidden dt:block dt:py-[34px] dt:px-7 dt:border-r dt:border-line dt:bg-surface-2">
        <h2 class="font-mono font-medium text-[12px] leading-none tracking-[0.12em] uppercase text-muted mb-4">
          Your answers
        </h2>
        <div class="flex flex-col gap-[18px] font-sans text-[16px] leading-[1.4] mb-6">
          <div>
            <div class="text-muted mb-1">Payment</div>
            <div class="text-ink font-medium">{{ paymentLabel ?? 'Not answered' }}</div>
          </div>
          <div>
            <div class="text-muted mb-1">Other income</div>
            <div class="text-ink font-medium">{{ incomeLabel ?? 'Not answered' }}</div>
          </div>
          <div>
            <div class="text-muted mb-1">Bedrooms</div>
            <div class="text-ink font-medium">{{ bedroomLabel ?? 'Not answered' }}</div>
          </div>
          <div>
            <div class="text-muted mb-1">Lives in</div>
            <div class="text-ink font-medium">{{ currentLgaName ?? 'Not answered' }}</div>
          </div>
        </div>
        <NuxtLink to="/income" class="btn-secondary w-full gap-2 mb-6">
          <Pencil :size="16" aria-hidden="true" />
          Change answers
        </NuxtLink>
        <WeightSplitBar :split="scored[0]!.split" />
      </aside>

      <main class="min-w-0">
        <p
          class="m-0 py-4 px-4 dt:px-10 bg-banner-bg border-b border-banner-border font-sans text-[16px] leading-[1.5] text-banner-text"
        >
          Rankings are based on public data. Only you know which areas suit your family.
        </p>

        <p
          v-if="noneWithin"
          class="m-0 py-4 px-4 dt:px-10 border-b border-line-soft font-sans text-[16px] leading-[1.5] text-body"
        >
          No area has a typical {{ bedrooms }}-bedroom rent under 30% of your income. The areas closest to it are
          listed first.
        </p>

        <div v-if="!tableView">
          <section v-for="group in bands" :key="group.band">
            <div class="pt-6 pb-2 px-4 dt:px-10">
              <h2 class="m-0 font-sans font-semibold text-[19px] leading-[1.3] text-ink">{{ group.heading }}</h2>
              <p v-if="group.note" class="mt-1 mb-0 font-sans text-[15px] leading-[1.5] text-muted">{{ group.note }}</p>
            </div>
            <ol class="list-none m-0 p-0">
              <li
                v-for="r in group.rows"
                :key="r.lga_code"
                class="py-4 px-4 dt:px-10 border-t border-line-soft grid grid-cols-[34px_minmax(0,1fr)] gap-x-3 gap-y-2 items-start dt:grid-cols-[44px_minmax(240px,1fr)_minmax(170px,auto)] dt:gap-5"
              >
                <div class="font-mono font-medium text-[20px] leading-[1.3] text-data-main">{{ r.rank }}</div>
                <div class="min-w-0">
                  <h3 class="m-0 font-sans font-semibold text-[21px] leading-[1.25]">
                    <NuxtLink
                      :to="`/results/${r.lga_code}`"
                      class="inline-flex items-center min-h-11 text-ink no-underline"
                    >
                      {{ r.lga_name }}
                    </NuxtLink>
                  </h3>
                  <div class="font-mono text-[14px] leading-[1.3] text-muted">{{ r.region }}</div>
                  <p
                    v-if="rowSentence(r, answers.weights)"
                    class="mt-2 mb-0 font-sans text-[16px] leading-[1.5] text-body dt:max-w-[52ch]"
                  >
                    {{ rowSentence(r, answers.weights) }}
                  </p>
                  <p
                    v-if="isCurrent(r.lga_code)"
                    class="inline-block mt-2 mb-0 py-1 px-[10px] bg-surface-info rounded-[6px] font-sans font-medium text-[14px] leading-[1.3] text-surface-info-text"
                  >
                    Where you live now
                  </p>
                </div>
                <div class="col-start-2 dt:col-start-3 dt:text-right">
                  <div v-if="r.rentSharePct != null" class="font-sans font-semibold text-[24px] leading-[1.2] text-ink">
                    {{ r.rentSharePct }}% of your income
                  </div>
                  <div v-else class="font-sans font-semibold text-[24px] leading-[1.2] text-ink">No rent data</div>
                  <div v-if="r.rentPerWeek" class="mt-1 font-mono text-[14px] leading-[1.35] text-muted">
                    Typical {{ bedrooms }}-bedroom rent: ${{ r.rentPerWeek }} a week
                  </div>
                </div>
              </li>
            </ol>
          </section>
        </div>

        <div v-else class="py-4 px-4 dt:px-10 overflow-x-auto">
          <table class="w-full border-collapse font-sans text-[16px] leading-[1.4]">
            <thead>
              <tr>
                <th scope="col" class="text-left py-[10px] px-3 font-mono font-medium text-[12px] tracking-[0.1em] uppercase text-muted">#</th>
                <th scope="col" class="text-left py-[10px] px-3 font-mono font-medium text-[12px] tracking-[0.1em] uppercase text-muted">Area</th>
                <th scope="col" class="text-left py-[10px] px-3 font-mono font-medium text-[12px] tracking-[0.1em] uppercase text-muted">Region</th>
                <th scope="col" class="text-right py-[10px] px-3 font-mono font-medium text-[12px] tracking-[0.1em] uppercase text-muted">Share of income</th>
                <th scope="col" class="text-right py-[10px] px-3 font-mono font-medium text-[12px] tracking-[0.1em] uppercase text-muted">Typical rent</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in scored" :key="r.lga_code">
                <td class="py-[10px] px-3 border-t border-line-soft font-mono text-ink">{{ r.rank }}</td>
                <th scope="row" class="text-left py-[10px] px-3 border-t border-line-soft font-sans font-normal text-ink">
                  <NuxtLink :to="`/results/${r.lga_code}`">{{ r.lga_name }}</NuxtLink>
                </th>
                <td class="py-[10px] px-3 border-t border-line-soft text-body">{{ r.region }}</td>
                <td class="py-[10px] px-3 border-t border-line-soft font-mono text-ink text-right">
                  {{ r.rentSharePct != null ? `${r.rentSharePct}%` : 'No data' }}
                </td>
                <td class="py-[10px] px-3 border-t border-line-soft font-mono text-ink text-right">
                  {{ r.rentPerWeek ? `$${r.rentPerWeek}` : 'No data' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="py-[22px] px-4 dt:px-10 pb-8 flex flex-col gap-3 dt:flex-row dt:items-center dt:gap-5">
          <button v-if="!tableView && !showAll" type="button" class="btn-secondary" @click="showAll = true">
            Show all 79 areas
          </button>
          <button
            type="button"
            class="btn-secondary border-none bg-transparent text-accent underline"
            @click="tableView = !tableView"
          >
            {{ tableView ? 'Show as a list' : 'Show as a table' }}
          </button>
        </div>
      </main>
    </div>
  </template>
</template>
