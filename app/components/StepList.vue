<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { questionSteps } from '~/composables/useQuestionSteps'

// The questionnaire as a list, beside the questions on a wide screen. A finished step shows what
// was answered and links back to it; the step being answered is outlined; the ones still to come
// are plain, so the shape of the whole thing is visible from any point in it.
const props = defineProps<{ currentStep: number }>()

const { answers } = useAnchorState()
const { byCode } = useLgaData()

const steps = computed(() =>
  questionSteps(answers.value, byCode(answers.value.currentLga)?.lga_name ?? null)
)
const isCurrent = (n: number) => n === props.currentStep
</script>

<template>
  <nav aria-label="Your answers so far">
    <ol class="list-none m-0 p-0 flex flex-col gap-2">
      <li v-for="step in steps" :key="step.number">
        <component
          :is="step.done && !isCurrent(step.number) ? 'NuxtLink' : 'div'"
          :to="step.done && !isCurrent(step.number) ? step.path : undefined"
          class="motion-colors flex items-start gap-3 p-3 rounded-[14px] border no-underline"
          :class="
            isCurrent(step.number)
              ? 'border-2 border-accent bg-surface-accent-tint'
              : step.done
                ? 'border-line bg-surface-2 hover:bg-surface-info'
                : 'border-line-soft bg-transparent'
          "
          :aria-current="isCurrent(step.number) ? 'step' : undefined"
        >
          <span
            class="shrink-0 w-6 h-6 mt-[2px] rounded-full flex items-center justify-center figure font-semibold text-[13px]"
            :class="
              step.done && !isCurrent(step.number)
                ? 'bg-accent text-accent-on'
                : isCurrent(step.number)
                  ? 'border-2 border-accent text-accent'
                  : 'border border-line-focus text-muted'
            "
            aria-hidden="true"
          >
            <Check v-if="step.done && !isCurrent(step.number)" :size="14" />
            <template v-else>{{ step.number }}</template>
          </span>
          <span class="min-w-0 flex flex-col gap-[2px]">
            <span
              class="font-sans text-[15px] leading-[1.3]"
              :class="isCurrent(step.number) ? 'font-semibold text-ink' : step.done ? 'text-ink' : 'text-muted'"
            >
              {{ step.label }}
            </span>
            <!-- Only once the step is actually done: the priority tiers hold defaults from the
                 start, so an answer would otherwise show for a step nobody has reached. -->
            <span
              v-if="step.answer && step.done && !isCurrent(step.number)"
              class="font-sans text-[14px] leading-[1.35] text-body"
            >
              {{ step.answer }}
            </span>
          </span>
        </component>
      </li>
    </ol>
  </nav>
</template>
