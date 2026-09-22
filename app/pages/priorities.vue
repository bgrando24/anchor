<script setup lang="ts">
import { PRIORITY_FACTORS } from '~/data/options'

useHead({ title: 'What matters most to you?' })

const { answers } = useAnchorState()
const { regionOf } = useLgaData()

onMounted(() => {
  const step = firstUnansweredStep(answers.value)
  if (step) navigateTo(step)
})

// The region comes from the area the user picked, so back never lands on the
// "We couldn't find that region" screen (QA#5).
const backTo = computed(() => {
  const region = regionOf(answers.value.currentLga)
  return region ? `/location/area?region=${encodeURIComponent(region)}` : '/location'
})

const split = computed(() => scoreSplit(answers.value.weights))
</script>

<template>
  <main class="max-w-[560px] mx-auto px-4 dt:px-6 pt-5 pb-10 flex flex-col gap-[22px]">
    <ProgressBar :current-step="4" :back-to="backTo" />
    <h1 class="m-0 font-sans font-semibold text-[27px] leading-[1.22] text-ink tracking-[-0.01em]">
      What matters most to you?
    </h1>
    <p class="-mt-3 mb-0 font-sans text-[17px] leading-[1.5] text-body">Your answers change the order of the areas.</p>

    <div class="py-[18px] px-5 bg-surface-info rounded-md">
      <div class="flex justify-between items-baseline gap-3 mb-[10px]">
        <div class="font-sans font-semibold text-[18px] leading-[1.3] text-ink">Rent</div>
        <div class="font-mono font-semibold text-[17px] leading-none text-surface-info-text">Always 50%</div>
      </div>
      <div class="h-[10px] rounded-[5px] bg-line overflow-hidden mb-3">
        <div class="w-1/2 h-full rounded-[5px] bg-data-main" />
      </div>
      <div class="font-sans text-[16px] leading-[1.5] text-body">
        How much of your income the rent takes is always half of each area's score.
      </div>
    </div>

    <div class="flex flex-col gap-[22px]">
      <div v-for="f in PRIORITY_FACTORS" :key="f.key">
        <div class="font-sans font-semibold text-[19px] leading-[1.3] text-ink mb-[3px]">{{ f.question }}</div>
        <div class="font-sans text-[16px] leading-[1.45] text-body mb-3">{{ f.hint }}</div>
        <TierSelector v-model="answers.weights[f.key]" :name="`tier-${f.key}`" :label="f.question" />
      </div>
    </div>

    <WeightSplitBar :split="split" />

    <NuxtLink to="/results" class="btn-primary">Show my results</NuxtLink>
  </main>
</template>
