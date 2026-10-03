<script setup lang="ts">
import { PRIORITY_FACTORS } from '~/data/options'
import { schoolsCount } from '~/composables/useAnchorState'

useHead({ title: 'What matters most to you?' })

definePageMeta({ layout: 'questions' })

const { answers } = useAnchorState()

onMounted(() => {
  const step = firstUnansweredStep(answers.value)
  if (step) navigateTo(step)
})

/**
 * Schools only appear here if the user indicated they have children who may move schools
 */
const schoolsApply = computed(() => schoolsCount(answers.value.schools));

const factors = computed(() => PRIORITY_FACTORS.filter((f) => f.key !== 'schools' || schoolsApply.value));

// Set once, when schools first become relevant, and left alone after that so a deliberate
// change is not overwritten on the way back to this page.
// Shared state, not a component ref: this page unmounts on every navigation away, and a plain
// ref would reset, re-fire the preset and overwrite a tier the user had deliberately changed.
const presetDone = useState('schools-tier-preset-done', () => false);
// watch if user changed the schools priority themselves
const userSetSchoolsPriority = useState('schools-tier-user-set', () => false);

let presetting = false;

// watch schools question
watch(
  schoolsApply,
  (applies) => {
    if (applies && !presetDone.value) {
      presetting = true
      answers.value.weights.schools = 'a_lot'
      presetting = false
      presetDone.value = true
    }
  },
  { immediate: true }
)

// Sync flush so the preset above is seen while `presetting` is still set; any other change
// to the weight is the user's own.
watch(
  () => answers.value.weights.schools,
  () => {
    if (!presetting) userSetSchoolsPriority.value = true
  },
  { flush: 'sync' }
)

/** The scoring drops schools to nought when they do not apply, so the bar has to agree. */
const split = computed(() =>
  scoreSplit({
    ...answers.value.weights,
    schools: schoolsApply.value ? answers.value.weights.schools : 'none'
  })
)
</script>

<template>
  <div class="flex flex-col gap-5">
    <h1 class="m-0 heading-step">
      What matters most to you?
    </h1>
    <p class="-mt-3 mb-0 font-sans text-[17px] leading-[1.5] text-body">Your answers change the order of the areas.</p>

    <div class="on-band py-5 px-5 bg-header-band rounded-[18px]">
      <div class="flex justify-between items-center gap-3 mb-[12px]">
        <div class="font-sans font-semibold text-[18px] leading-[1.3] text-header-band-text">Rent</div>
        <div
          class="py-[5px] px-3 rounded-full bg-header-cta font-sans font-semibold text-[14px] leading-none text-on-header-cta"
        >
          Always half
        </div>
      </div>
      <div class="h-[10px] rounded-[5px] bg-header-chip-bg overflow-hidden mb-3">
        <div class="w-1/2 h-full rounded-[5px] bg-header-cta" />
      </div>
      <div class="font-sans text-[16px] leading-[1.5] text-header-band-body">
        How much of your income the rent takes is always half of each area's score.
      </div>
    </div>

    <div class="flex flex-col gap-[22px]">
      <div v-for="f in factors" :key="f.key" class="p-5 rounded-[16px] bg-surface-2 border border-line">
        <div class="font-sans font-semibold text-[19px] leading-[1.3] text-ink mb-[3px]">{{ f.question }}</div>
        <div class="font-sans text-[16px] leading-[1.45] text-body mb-5">{{ f.hint }}</div>
        <!-- Plain copy rather than a tooltip: a hover has nowhere to happen on a phone, and the
             reason for a pre-filled answer should not be something you have to go looking for. -->
        <p v-if="f.key === 'schools' && !userSetSchoolsPriority" class="m-0 mb-3 font-sans text-[16px] leading-[1.45] text-body p-2 rounded-md border border-strong border-accent">
          We automatically set this priority for you given your answers to the previous section. 
          You can still change this if you like.
        </p>
        <TierSelector v-model="answers.weights[f.key]" :name="`tier-${f.key}`" :label="f.question" />
      </div>
    </div>

    <WeightSplitBar :split="split" />

    <NuxtLink to="/results" class="btn-primary">Show my results</NuxtLink>
  </div>
</template>
