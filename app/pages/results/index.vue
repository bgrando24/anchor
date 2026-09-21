<script setup lang="ts">
import { PAYMENT_TYPES, PRIORITY_FACTORS } from '~/data/options'

useHead({ title: 'Your ranked areas' })

const { answers } = useAnchorState()
const { byCode } = useLgaData()

onMounted(() => {
  const hash = window.location.hash
  if (!hash) return
  const decoded = decodeAnswersFromFragment(hash)
  if (decoded) {
    answers.value = decoded
  } else {
    navigateTo('/invalid-link')
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
const SHORT_NAMES = { schools: 'schools', transport: 'transport', gp_access: 'doctors' } as const
const prioritySummary = computed(() => {
  const top = PRIORITY_FACTORS.filter((f) => answers.value.weights[f.key] === 'a_lot').map((f) => SHORT_NAMES[f.key])
  if (!top.length) return 'No strong priorities'
  const list = top.join(', ')
  return list.charAt(0).toUpperCase() + list.slice(1)
})

function isCurrent(code: number) {
  return answers.value.currentLga === code
}
</script>

<template>
  <div class="min-h-screen bg-bg">
    <div class="bg-header-band text-header-band-text">
      <AppHeader variant="band" share-to="/share" />
      <div class="max-w-[1280px] mx-auto px-6 pb-[18px] flex flex-col gap-2 dt:pt-[22px] dt:px-10 dt:pb-[22px]">
        <h1 class="m-0 font-sans font-semibold text-[26px] leading-[1.25] tracking-[-0.01em]">79 areas, ranked for you</h1>
        <p class="m-0 mb-[6px] font-sans text-[16px] leading-[1.5] text-header-band-body">Best first. Rent affordability is half of every score.</p>
        <div class="flex gap-2 flex-wrap items-center">
          <div v-if="paymentLabel" class="py-[7px] px-[13px] bg-header-chip-bg rounded-full font-sans text-[14px] leading-[1.3] text-header-chip-text">{{ paymentLabel }}</div>
          <div v-if="currentLgaName" class="py-[7px] px-[13px] bg-header-chip-bg rounded-full font-sans text-[14px] leading-[1.3] text-header-chip-text">{{ currentLgaName }}</div>
          <div class="py-[7px] px-[13px] bg-header-chip-bg rounded-full font-sans text-[14px] leading-[1.3] text-header-chip-text">{{ prioritySummary }}</div>
          <NuxtLink
            to="/income"
            class="min-h-9 inline-flex items-center px-[13px] border border-header-chip-outline rounded-full text-header-cta font-sans font-medium text-[14px] leading-none no-underline"
          >
            Change answers
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="max-w-[1280px] mx-auto grid grid-cols-1 dt:grid-cols-[312px_1fr]">
      <aside class="hidden dt:block dt:py-[34px] dt:px-8 dt:border-r dt:border-line dt:bg-surface-2">
        <div class="font-mono font-medium text-[12px] leading-none tracking-[0.12em] uppercase text-muted mb-4">Your answers</div>
        <div class="flex flex-col gap-[18px] font-sans text-[16px] leading-[1.4] mb-6">
          <div><div class="text-muted mb-1">Payment</div><div class="text-ink font-medium">{{ paymentLabel ?? '—' }}</div></div>
          <div><div class="text-muted mb-1">Living in</div><div class="text-ink font-medium">{{ currentLgaName ?? '—' }}</div></div>
        </div>
        <div class="h-px bg-line-soft mt-2 mb-[22px]" />
        <div class="font-mono font-medium text-[12px] leading-none tracking-[0.12em] uppercase text-muted mb-4">Weighting</div>
        <WeightSplitBar :weights="scored[0]?.scoreWeights ?? { affordability: 50, schools: 0, transport: 0, gp_access: 0 }" />
        <NuxtLink to="/income" class="btn-secondary w-full mt-[22px]">Change answers</NuxtLink>
        <p class="mt-4 mb-0 font-sans text-[15px] leading-[1.5] text-muted">Rent affordability is always half the score and can't be changed.</p>
      </aside>

      <main>
        <SuggestionBanner />

        <div class="hidden dt:grid dt:grid-cols-[44px_1fr_150px_190px_120px] dt:gap-5 dt:px-10 dt:pb-[10px] font-mono font-medium text-[12px] leading-none tracking-[0.1em] uppercase text-muted">
          <div>#</div><div>Area</div><div>Affordable</div><div>Steadiness</div><div class="text-right">Score</div>
        </div>

        <div v-if="!tableView" class="flex flex-col">
          <article
            v-for="r in visible"
            :key="r.lga_code"
            class="py-[18px] px-6 border-b border-line-soft flex gap-4 items-start dt:py-5 dt:px-10 dt:grid dt:grid-cols-[44px_1fr_150px_190px_120px] dt:gap-5 dt:items-start dt:border-t dt:border-line-soft dt:border-b-0"
          >
            <div class="w-[34px] shrink-0 text-right font-mono font-medium text-[20px] leading-none text-data-main dt:text-left">{{ r.rank }}</div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-baseline gap-[10px] flex-wrap dt:flex-nowrap">
                <NuxtLink :to="`/results/${r.lga_code}`" class="font-sans font-semibold text-[21px] leading-[1.25] text-ink no-underline">{{ r.lga_name }}</NuxtLink>
                <span class="font-mono text-[14px] leading-none text-muted">{{ r.subregion }}</span>
                <span v-if="isCurrent(r.lga_code)" class="inline-block mt-2 py-1 px-[10px] bg-surface-info rounded-[6px] font-sans font-medium text-[14px] leading-[1.3] text-surface-info-text">Where you live now</span>
              </div>
              <div class="mt-3 flex items-baseline gap-[10px] dt:hidden">
                <span class="font-sans font-semibold text-[28px] leading-none text-ink tracking-[-0.01em]">{{ oneIn(r.affordability_pct_latest) }}</span>
                <span class="font-sans text-[16px] leading-[1.3] text-body">rentals affordable</span>
              </div>
              <div class="mt-[6px] font-mono text-[14px] leading-[1.3] text-muted dt:hidden">{{ pctLabel(r.affordability_pct_latest) }} last quarter &middot; {{ stabilityLabel(r.affordability_pct_5yr_stddev) }}</div>
              <div class="mt-[10px] font-sans text-[16px] leading-[1.5] text-body dt:mt-2 dt:max-w-[58ch]">{{ explainRanking(r, isCurrent(r.lga_code)) }}</div>
              <div class="mt-3 flex items-center gap-3 dt:hidden">
                <div class="flex-1 h-2 rounded-[4px] bg-line overflow-hidden"><div class="h-full rounded-[4px] bg-data-main" :style="{ width: (r.scores.total * 10) + '%' }" /></div>
                <div class="font-mono font-medium text-[15px] leading-none text-ink min-w-[72px] shrink-0 whitespace-nowrap text-right">{{ r.scores.total.toFixed(1) }} / 10</div>
              </div>
              <NuxtLink :to="`/results/${r.lga_code}`" class="inline-block mt-[14px] min-h-11 leading-[44px] font-sans font-medium text-[17px] dt:hidden">See the detail for {{ r.lga_name }}</NuxtLink>
            </div>
            <div class="hidden dt:block">
              <div class="font-sans font-semibold text-[22px] leading-[1.1] text-ink">{{ oneIn(r.affordability_pct_latest) }}</div>
              <div class="mt-[5px] font-mono text-[14px] leading-[1.3] text-muted">{{ pctLabel(r.affordability_pct_latest) }}</div>
            </div>
            <div class="hidden dt:block font-sans text-[16px] leading-[1.4] text-body">{{ stabilityLabel(r.affordability_pct_5yr_stddev) }}</div>
            <div class="hidden dt:block">
              <div class="font-mono font-medium text-[16px] leading-none text-ink text-right mb-2">{{ r.scores.total.toFixed(1) }} / 10</div>
              <div class="h-2 rounded-[4px] bg-line overflow-hidden"><div class="h-full rounded-[4px] bg-data-main" :style="{ width: (r.scores.total * 10) + '%' }" /></div>
            </div>
          </article>
        </div>

        <div v-else class="py-4 px-6 overflow-x-auto dt:px-10">
          <table class="w-full border-collapse font-sans text-[16px] leading-[1.4]">
            <thead>
              <tr>
                <th scope="col" class="text-left py-[10px] px-3 font-mono font-medium text-[12px] leading-none tracking-[0.1em] uppercase text-muted">#</th>
                <th scope="col" class="text-left py-[10px] px-3 font-mono font-medium text-[12px] leading-none tracking-[0.1em] uppercase text-muted">Area</th>
                <th scope="col" class="text-left py-[10px] px-3 font-mono font-medium text-[12px] leading-none tracking-[0.1em] uppercase text-muted">Affordable</th>
                <th scope="col" class="text-left py-[10px] px-3 font-mono font-medium text-[12px] leading-none tracking-[0.1em] uppercase text-muted">Steadiness</th>
                <th scope="col" class="text-right py-[10px] px-3 font-mono font-medium text-[12px] leading-none tracking-[0.1em] uppercase text-muted">Score</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in scored" :key="r.lga_code">
                <td class="text-left py-[10px] px-3 border-t border-line-soft font-mono text-ink">{{ r.rank }}</td>
                <td class="text-left py-[10px] px-3 border-t border-line-soft font-mono text-ink"><NuxtLink :to="`/results/${r.lga_code}`">{{ r.lga_name }}</NuxtLink></td>
                <td class="text-left py-[10px] px-3 border-t border-line-soft font-mono text-ink">{{ pctLabel(r.affordability_pct_latest) }}</td>
                <td class="text-left py-[10px] px-3 border-t border-line-soft font-mono text-ink">{{ stabilityWord(r.affordability_pct_5yr_stddev) }}</td>
                <td class="text-right py-[10px] px-3 border-t border-line-soft font-mono text-ink">{{ r.scores.total.toFixed(1) }} / 10</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="py-[22px] px-6 pb-8 flex flex-col gap-[14px] dt:flex-row dt:items-center dt:py-[26px] dt:px-10 dt:pb-[34px]">
          <button v-if="!tableView && !showAll" type="button" class="btn-secondary" @click="showAll = true">
            Show the remaining {{ remaining }} areas
          </button>
          <button type="button" class="border-none bg-transparent p-0 font-sans font-medium text-[16px] leading-[1.4] text-accent underline text-center cursor-pointer" @click="tableView = !tableView">
            {{ tableView ? 'View as a list' : 'View all 79 as a table' }}
          </button>
        </div>
      </main>
    </div>
  </div>
</template>
