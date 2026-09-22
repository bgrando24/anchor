<script setup lang="ts">
import { BEDROOM_OPTIONS } from '~/data/options'

definePageMeta({ layout: 'bare' })
useHead({ title: 'Your Anchor results' })

useFragmentSync()

const { answers, scored, bedrooms } = useResults()
const requestUrl = useRequestURL()

const top5 = computed(() => scored.value.slice(0, 5))
const bedroomLabel = computed(() => BEDROOM_OPTIONS.find((b) => b.value === answers.value.bedrooms)?.label ?? '')

const today = computed(() =>
  new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
)

const shareLink = computed(() => `${requestUrl.origin}/results${encodeAnswersToFragment(answers.value)}`)

function printPage() {
  window.print()
}
</script>

<template>
  <!-- The @media print token override in tokens.css keeps dark mode off the paper (QA#10). -->
  <div class="min-h-screen bg-bg print:bg-white">
    <div class="max-w-[720px] mx-auto py-6 px-4 dt:px-6 print:hidden">
      <button type="button" class="btn-primary" @click="printPage">Print or save as PDF</button>
    </div>

    <div
      class="max-w-[720px] mx-auto bg-surface-2 text-ink py-7 px-6 dt:px-9 mb-10 flex flex-col print:mx-0 print:max-w-none print:mb-0 print:p-0"
    >
      <div class="flex justify-between items-start gap-4 pb-3 border-b-2 border-ink">
        <div class="min-w-0">
          <div class="flex items-center gap-2 mb-[10px] text-ink">
            <LogoMark :size="20" />
            <span class="font-sans font-bold text-[13px] leading-none tracking-[0.2em]">ANCHOR</span>
          </div>
          <h1 class="m-0 font-sans font-semibold text-[26px] leading-[1.15] tracking-[-0.02em]">Your Anchor results</h1>
        </div>
      </div>

      <p class="mt-3 mb-1 font-sans text-[15px] leading-[1.45] text-body">
        Ranked by how much of your income the rent would take, then by what you said matters. Based on public data.
      </p>
      <p class="m-0 mb-4 font-mono text-[13px] leading-[1.4] text-muted">
        {{ today }} · Top {{ top5.length }} of {{ scored.length }} areas · {{ bedroomLabel }}
      </p>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th scope="col" class="text-left py-2 pr-2 font-mono font-medium text-[12px] tracking-[0.08em] uppercase text-muted w-9">Rank</th>
              <th scope="col" class="text-left py-2 pr-3 font-mono font-medium text-[12px] tracking-[0.08em] uppercase text-muted">Area</th>
              <th scope="col" class="text-right py-2 px-3 font-mono font-medium text-[12px] tracking-[0.08em] uppercase text-muted">Share of income</th>
              <th scope="col" class="text-right py-2 pl-3 font-mono font-medium text-[12px] tracking-[0.08em] uppercase text-muted">Typical rent</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in top5" :key="r.lga_code">
              <td class="py-3 pr-2 border-t border-line align-top font-mono font-medium text-[17px] leading-[1.3] text-data-main">
                {{ r.rank }}
              </td>
              <th scope="row" class="py-3 pr-3 border-t border-line align-top text-left">
                <div class="font-sans font-semibold text-[17px] leading-[1.3] text-ink">{{ r.lga_name }}</div>
                <div class="mt-1 font-mono font-normal text-[14px] leading-[1.3] text-muted">{{ r.region }}</div>
              </th>
              <td class="py-3 px-3 border-t border-line align-top text-right font-sans font-semibold text-[17px] leading-[1.3]">
                {{ r.rentSharePct != null ? `${r.rentSharePct}%` : 'No data' }}
              </td>
              <td class="py-3 pl-3 border-t border-line align-top text-right font-mono text-[15px] leading-[1.3]">
                {{ r.rentPerWeek ? `$${r.rentPerWeek} a week` : 'No data' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-5 pt-3 border-t border-line">
        <div class="font-mono font-medium text-[12px] leading-none tracking-[0.08em] uppercase text-muted mb-2">
          Open these results again
        </div>
        <div class="font-mono text-[14px] leading-[1.4] text-surface-info-text break-all">{{ shareLink }}</div>
      </div>
    </div>
  </div>
</template>

<style>
@page {
  size: A4;
  margin: 16mm;
}
</style>
