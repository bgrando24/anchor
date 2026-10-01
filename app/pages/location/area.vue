<script setup lang="ts">
useHead({ title: 'Which area do you live in?' })

const route = useRoute()
const { answers } = useAnchorState()
const { byRegion } = useLgaData()

const region = computed(() => String(route.query.region ?? ''))
const areas = computed(() => byRegion(region.value))

const options = computed(() => areas.value.map((a) => ({ value: a.lga_code, label: a.lga_name })))

function selectArea(code: string | number) {
  answers.value.currentLga = Number(code)
}

const canContinue = computed(() => answers.value.currentLga != null)
</script>

<template>
  <main class="max-w-[560px] mx-auto px-4 dt:px-6 pt-5 pb-10 flex flex-col gap-[18px]">
    <ProgressBar :current-step="3" back-to="/location" />

    <NuxtLink
      to="/location"
      class="inline-flex items-center gap-2 self-start min-h-11 py-2 px-[14px] bg-surface-info rounded-full font-sans font-medium text-[15px] leading-none text-surface-info-text no-underline"
    >
      <template v-if="region">{{ region }} · Change</template>
      <template v-else>Choose a region</template>
    </NuxtLink>
    <h1 class="m-0 font-sans font-semibold text-[27px] leading-[1.22] text-ink tracking-[-0.01em]">
      Which area do you live in?
    </h1>

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
      to="/priorities"
      class="btn-primary"
      :class="{ 'opacity-50 pointer-events-none': !canContinue }"
      :aria-disabled="!canContinue"
      @click="!canContinue && $event.preventDefault()"
    >
      Continue
    </NuxtLink>
  </main>
</template>
