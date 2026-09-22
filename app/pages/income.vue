<script setup lang="ts">
import { PAYMENT_TYPES, INCOME_BANDS } from '~/data/options'

useHead({ title: 'Your Centrelink payment' })

const { answers } = useAnchorState()

const canContinue = computed(() => !!answers.value.paymentType)

const paymentOptions = computed(() => PAYMENT_TYPES.map((p) => ({ value: p.value, label: p.label })))

function selectPayment(value: string | number) {
  answers.value.paymentType = String(value)
}
</script>

<template>
  <main class="max-w-[560px] mx-auto px-4 dt:px-6 pt-5 pb-10 flex flex-col gap-5">
    <ProgressBar :current-step="1" back-to="/" />
    <h1 class="m-0 font-sans font-semibold text-[27px] leading-[1.22] text-ink tracking-[-0.01em]">
      Which Centrelink payment do you get?
    </h1>
    <p class="-mt-2 mb-0 font-sans text-[17px] leading-[1.5] text-body">We use this to estimate your income.</p>

    <RadioGroup
      name="payment-type"
      legend="Which Centrelink payment do you get?"
      :options="paymentOptions"
      :model-value="answers.paymentType"
      @update:model-value="selectPayment"
    />
    <p class="-mt-[6px] mb-0 font-sans text-[15px] leading-[1.5] text-muted">
      <NuxtLink to="/faq#payments" class="inline-flex items-center min-h-11">Why only these payments?</NuxtLink>
    </p>

    <div class="flex flex-col gap-1">
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

    <div class="py-[18px] px-5 bg-surface-info rounded-md font-sans text-[16px] leading-[1.5] text-body">
      Your answers aren't sent anywhere. They're only used on this device.
    </div>

    <NuxtLink
      to="/bedrooms"
      class="btn-primary"
      :aria-disabled="!canContinue"
      :class="{ 'opacity-50 pointer-events-none': !canContinue }"
      @click="!canContinue && $event.preventDefault()"
    >
      Continue
    </NuxtLink>
  </main>
</template>
