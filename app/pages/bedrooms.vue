<script setup lang="ts">
import { BEDROOM_OPTIONS } from '~/data/options'
import type { Bedrooms } from '~/composables/useScoring'

useHead({ title: 'Bedrooms' })

definePageMeta({ layout: 'questions' })

const { answers } = useAnchorState()

onMounted(() => {
  if (answers.value.paymentType == null) navigateTo('/income')
})

// Same readiness the step row uses, so the two buttons can never disagree.
const frame = useQuestionFrame()
const canContinue = computed(() => frame.value?.continueReady ?? false)

function selectBedrooms(value: string | number) {
  answers.value.bedrooms = Number(value) as Bedrooms
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <h1 class="m-0 heading-step">
      How many bedrooms do you need?
    </h1>
    <p class="-mt-2 mb-0 font-sans text-[17px] leading-[1.5] text-body">
      We'll compare rents for homes with at least this many bedrooms.
    </p>

    <RadioGroup
      name="bedrooms"
      legend="How many bedrooms do you need?"
      :options="BEDROOM_OPTIONS"
      :model-value="answers.bedrooms"
      @update:model-value="selectBedrooms"
    />

    <NuxtLink
      to="/location"
      class="btn-primary"
      :aria-disabled="!canContinue"
      :class="{ 'opacity-50 pointer-events-none': !canContinue }"
      @click="!canContinue && $event.preventDefault()"
    >
      Continue
    </NuxtLink>
  </div>
</template>
