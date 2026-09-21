<script setup lang="ts">
import { PAYMENT_TYPES, INCOME_BANDS } from '~/data/options'

useHead({ title: 'Your income' })

const { answers } = useAnchorState()

const canContinue = computed(() => !!answers.value.paymentType)

function selectPayment(value: string | number) {
  answers.value.paymentType = String(value)
}
</script>

<template>
  <div class="min-h-screen bg-bg">
    <main class="max-w-[560px] mx-auto px-6 pt-5 pb-10 flex flex-col gap-5">
      <ProgressBar :current-step="1" back-to="/" />
      <h1 class="m-0 font-sans font-semibold text-[27px] leading-[1.22] text-ink tracking-[-0.01em]">
        Which payment do you get?
      </h1>
      <p class="-mt-2 mb-0 font-sans text-[17px] leading-[1.5] text-body">This sets the income your rent gets measured against.</p>

      <div class="flex flex-col gap-[10px]" role="radiogroup" aria-label="Which payment do you get?">
        <RadioOption
          v-for="p in PAYMENT_TYPES"
          :key="p.value"
          name="payment-type"
          :value="p.value"
          :label="p.label"
          :model-value="answers.paymentType"
          @update:model-value="selectPayment"
        />
      </div>
      <p class="-mt-[6px] mb-0 font-sans text-[15px] leading-[1.5] text-muted">
        These are the payments the tool can model.
        <NuxtLink to="/faq#payments">Why not others?</NuxtLink>
      </p>

      <div class="flex flex-col gap-1">
        <div class="font-sans font-semibold text-[19px] leading-[1.3] text-ink">Any other income?</div>
        <div class="mb-2 font-sans text-[16px] leading-[1.5] text-body">Wages, child support, anything else. Optional.</div>
        <label class="visually-hidden" for="income-band">Any other income</label>
        <select id="income-band" v-model="answers.incomeBand" class="field-select">
          <option :value="null" disabled>Choose a range</option>
          <option v-for="b in INCOME_BANDS" :key="b.value" :value="b.value">{{ b.label }}</option>
        </select>
      </div>

      <PrivacyNote
        title="This stays on your phone."
        body="Your payment type and income are never sent anywhere. Close the tab and they're gone."
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
    </main>
  </div>
</template>
