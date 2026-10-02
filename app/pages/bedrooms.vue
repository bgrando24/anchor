<script setup lang="ts">
import { BEDROOM_OPTIONS } from '~/data/options'
import type { Bedrooms } from '~/composables/useScoring'

useHead({ title: 'Bedrooms' })

const { answers } = useAnchorState()

onMounted(() => {
  if (answers.value.paymentType == null) navigateTo('/income')
})

const canContinue = computed(() => answers.value.bedrooms != null)

function selectBedrooms(value: string | number) {
  answers.value.bedrooms = Number(value) as Bedrooms
}
</script>

<template>
  <QuestionPage :current-step="2" back-to="/income" continue-to="/location" :continue-ready="canContinue">
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
  </QuestionPage>
</template>
