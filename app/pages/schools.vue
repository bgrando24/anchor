<script setup lang="ts">
import { SCHOOL_LEVELS, SCHOOL_SECTORS, type SchoolLevel, type SchoolSector } from '~/data/options'
import { schoolsStepComplete } from '~/composables/useAnchorState'

useHead({ title: 'Schools' })

definePageMeta({ layout: 'questions' })

const { answers } = useAnchorState()
onMounted(() => {
  if (answers.value.paymentType == null) navigateTo('/income')
  else if (answers.value.bedrooms == null) navigateTo('/bedrooms')
  else if (answers.value.currentLga == null) navigateTo('/location')
})

const schools = computed(() => answers.value.schools)

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' }
]

const levelOptions = SCHOOL_LEVELS.map((l) => ({ value: l.value, label: l.label }))
const sectorOptions = SCHOOL_SECTORS.map((s) => ({ value: s.value, label: s.label }))

function setHasKids(value: string | number) {
  const has = value === 'yes'
  if (has === schools.value.hasKidsAtSchool) return
  // Starting again from "no" should not leave the follow-up answers behind.
  answers.value.schools = { hasKidsAtSchool: has, levels: [], sectors: [], movingSchools: null }
}

function setLevels(values: string[]) {
  answers.value.schools.levels = values as SchoolLevel[]
}

function setSectors(values: string[]) {
  answers.value.schools.sectors = values as SchoolSector[]
}

function setMoving(value: string | number) {
  const moving = value === 'yes'
  answers.value.schools.movingSchools = moving
  // If they'd stay put, the school types are never used, so don't keep them around.
  if (!moving) {
    answers.value.schools.levels = []
    answers.value.schools.sectors = []
  }
}

// Each question appears once the one before it is answered, so nobody is asked about school
// types before saying whether anyone is at school, and nobody is asked about them if they
// wouldn't be changing schools.
const askMoving = computed(() => schools.value.hasKidsAtSchool === true)
const askLevels = computed(() => askMoving.value && schools.value.movingSchools === true)
const askSectors = computed(() => askLevels.value && schools.value.levels.length > 0)

// Same readiness the step row uses, so the two buttons can never disagree.
const frame = useQuestionFrame()
const canContinue = computed(() => frame.value?.continueReady ?? false)

/** Says plainly what the answer just did, rather than leaving the reason to be guessed at. */
const outcome = computed(() => {
  const s = schools.value
  if (s.hasKidsAtSchool === false) {
    return "We won't count schools in your ranking. You can still see each area's schools on its page."
  }
  if (s.movingSchools === false) {
    return "Because they'd stay at their school, we won't count schools in your ranking. You can still see each area's schools on its page."
  }
  if (s.movingSchools === true) {
    return "We'll count schools in your ranking, and set them to matter 'a lot' on the next step. You can change that."
  }
  return ''
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <h1 class="m-0 heading-step">
      Do you have children or dependants at school?
    </h1>
    <p class="-mt-2 mb-0 font-sans text-[17px] leading-[1.5] text-body">
      We only ask so we know whether to weigh up schools when we rank areas.
    </p>

    <RadioGroup
      name="has-kids-at-school"
      legend="Do you have children at primary or high school?"
      :options="YES_NO"
      :model-value="schools.hasKidsAtSchool == null ? null : schools.hasKidsAtSchool ? 'yes' : 'no'"
      @update:model-value="setHasKids"
    />

    <template v-if="askMoving">
      <RadioGroup
        name="moving-schools"
        legend="If you moved, would they change schools?"
        show-legend
        :options="YES_NO"
        :model-value="schools.movingSchools == null ? null : schools.movingSchools ? 'yes' : 'no'"
        @update:model-value="setMoving"
      />
      <p class="-mt-[6px] mb-0 font-sans text-[15px] leading-[1.5] text-muted">
        If they'd stay where they are, the schools near a new home wouldn't change your choice.
      </p>
    </template>

    <CheckboxGroup
      v-if="askLevels"
      name="school-levels"
      legend="What level(s) of schooling do they currently attend?"
      show-legend
      :options="levelOptions"
      :model-value="schools.levels"
      @update:model-value="setLevels"
    />

    <template v-if="askSectors">
      <CheckboxGroup
        name="school-sectors"
        legend="What type(s) of school would you consider?"
        show-legend
        :options="sectorOptions"
        :model-value="schools.sectors"
        @update:model-value="setSectors"
      />
      <p class="-mt-[6px] mb-0 font-sans text-[15px] leading-[1.5] text-muted">
        We'll only count these types when we rank areas.
      </p>
    </template>

    <div
      v-if="outcome"
      class="py-[18px] px-5 bg-surface-info rounded-md font-sans text-[16px] leading-[1.5] text-body"
    >
      {{ outcome }}
    </div>

    <NuxtLink
      to="/priorities"
      class="btn-primary"
      :aria-disabled="!canContinue"
      :class="{ 'opacity-50 pointer-events-none': !canContinue }"
      @click="!canContinue && $event.preventDefault()"
    >
      Continue
    </NuxtLink>
  </div>
</template>
