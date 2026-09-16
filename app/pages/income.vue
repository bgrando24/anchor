<script setup lang="ts">
import { PAYMENT_TYPES, INCOME_BANDS } from '~/data/options'

useHead({ title: 'ANCHOR — your income' })

const { answers } = useAnchorState()

const canContinue = computed(() => !!answers.value.paymentType)

function selectPayment(value: string | number) {
  answers.value.paymentType = String(value)
}
</script>

<template>
  <div class="page">
    <main class="content">
      <ProgressBar :current-step="1" back-to="/" />
      <h1>Which payment do you get?</h1>
      <p class="lede">This sets the income your rent gets measured against.</p>

      <div class="options" role="radiogroup" aria-label="Which payment do you get?">
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
      <p class="hint">
        These are the payments the tool can model.
        <NuxtLink to="/faq">Why not others?</NuxtLink>
      </p>

      <div class="income-block">
        <div class="block-title">Any other income?</div>
        <div class="block-body">Wages, child support, anything else. Optional.</div>
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
        :class="{ disabled: !canContinue }"
        @click="!canContinue && $event.preventDefault()"
      >
        Continue
      </NuxtLink>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
}

.content {
  max-width: 560px;
  margin: 0 auto;
  padding: 20px 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

h1 {
  margin: 0;
  font: 600 27px/1.22 var(--font-sans);
  color: var(--ink);
  letter-spacing: -0.01em;
}

.lede {
  margin: -8px 0 0;
  font: 400 17px/1.5 var(--font-sans);
  color: var(--body);
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hint {
  margin: -6px 0 0;
  font: 400 15px/1.5 var(--font-sans);
  color: var(--muted);
}

.income-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.block-title {
  font: 600 19px/1.3 var(--font-sans);
  color: var(--ink);
}

.block-body {
  font: 400 16px/1.5 var(--font-sans);
  color: var(--body);
  margin-bottom: 8px;
}

.disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
