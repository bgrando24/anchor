<script setup lang="ts">
import { PAYMENT_TYPES, INCOME_BANDS } from '~/data/options'

useHead({ title: 'Your Centrelink payment' })

definePageMeta({ layout: 'questions' })

const { answers } = useAnchorState()

// Same readiness the step row uses, so the two buttons can never disagree.
const frame = useQuestionFrame()
const canContinue = computed(() => frame.value?.continueReady ?? false)

const paymentOptions = computed(() => PAYMENT_TYPES.map((p) => ({ value: p.value, label: p.label })))

function selectPayment(value: string | number) {
  answers.value.paymentType = String(value)
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <h1 class="m-0 heading-step">
      Which Centrelink payment do you receive?
    </h1>
    <p class="-mt-2 mb-0 font-sans text-[17px] leading-[1.5] text-body">We use this to estimate your income.</p>

    <RadioGroup
      name="payment-type"
      legend="Which Centrelink payment do you receive?"
      :options="paymentOptions"
      :model-value="answers.paymentType"
      @update:model-value="selectPayment"
    />
    <p class="-mt-[6px] mb-0 font-sans text-[15px] leading-[1.5] text-muted">
      <NuxtLink to="/faq#payments" class="inline-flex items-center min-h-11">Why only these payments?</NuxtLink>
    </p>

    <div class="flex flex-col gap-1 p-5 rounded-[16px] bg-surface-2 border border-line">
      <label for="income-band" class="font-sans font-semibold text-[19px] leading-[1.3] text-ink">
        Do you have any other income?
      </label>
      <div id="income-hint" class="mb-2 font-sans text-[16px] leading-[1.5] text-body">
        Include wages, child support and Family Tax Benefit. Choose the closest amount.
      </div>
      <select id="income-band" v-model="answers.incomeBand" class="field-select" aria-describedby="income-hint">
        <option :value="null" disabled>Choose an amount</option>
        <option v-for="b in INCOME_BANDS" :key="b.value" :value="b.value">{{ b.label }}</option>
      </select>
    </div>

    <PrivacyNote class="dt:hidden">
      Your answers aren't sent anywhere. They're only used on this device.
    </PrivacyNote>

    <NuxtLink
      to="/bedrooms"
      class="btn-primary"
      :aria-disabled="!canContinue"
      :class="{ 'opacity-50 pointer-events-none': !canContinue }"
      @click="!canContinue && $event.preventDefault()"
    >
      Continue
    </NuxtLink>
  </div>
</template>
