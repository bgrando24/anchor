<script setup lang="ts">
useHead({ title: 'Which area do you live in?' })

definePageMeta({ layout: 'questions' })

const route = useRoute()
const { answers } = useAnchorState()
const { byRegion } = useLgaData()

const region = computed(() => String(route.query.region ?? ''))
const areas = computed(() => byRegion(region.value))

const options = computed(() => areas.value.map((a) => ({ value: a.lga_code, label: a.lga_name })))

function selectArea(code: string | number) {
  answers.value.currentLga = Number(code)
}

// Same readiness the step row uses, so the two buttons can never disagree.
const frame = useQuestionFrame()
const canContinue = computed(() => frame.value?.continueReady ?? false)
</script>

<template>
  <div class="flex flex-col gap-5">

    <h1 class="m-0 heading-step">Which area do you live in?</h1>
    <p v-if="region" class="-mt-2 mb-0 font-sans text-[17px] leading-[1.5] text-body">
      Showing areas in {{ region }}.
    </p>
    
    <RadioGroup
      v-if="areas.length"
      name="area-choice"
      :legend="`Which area in ${region}`"
      :options="options"
      :model-value="answers.currentLga"
      @update:model-value="selectArea"
    />
    <p v-else class="font-sans text-[16px] leading-[1.5] text-body">
      We couldn't find that region.
      <NuxtLink to="/location">Choose a region</NuxtLink>
    </p>

    <NuxtLink
      to="/schools"
      class="btn-primary"
      :class="{ 'opacity-50 pointer-events-none': !canContinue }"
      :aria-disabled="!canContinue"
      @click="!canContinue && $event.preventDefault()"
    >
      Continue
    </NuxtLink>
  </div>
</template>
