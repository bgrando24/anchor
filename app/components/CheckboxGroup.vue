<script setup lang="ts">
// Native checkboxes in a fieldset, the same shape as the radio group: each box is its own tab
// stop, which is what a screen reader expects when more than one answer can be true.
export interface CheckboxGroupOption {
  value: string
  label: string
  sublabel?: string
}

withDefaults(
  defineProps<{
    modelValue: string[]
    options: CheckboxGroupOption[]
    name: string
    legend: string
    /** Show the legend instead of hiding it from sighted users. */
    showLegend?: boolean
  }>(),
  { showLegend: false }
)

const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

function toggle(value: string, checked: boolean, chosen: string[], options: CheckboxGroupOption[]) {
  const next = checked ? [...chosen, value] : chosen.filter((v) => v !== value)
  // Keep the declared order, so the answers read and encode the same however they were clicked.
  emit(
    'update:modelValue',
    options.filter((o) => next.includes(o.value)).map((o) => o.value)
  )
}
</script>

<template>
  <fieldset class="m-0 p-0 border-0 min-w-0">
    <legend
      :class="
        showLegend ? 'p-0 mb-3 font-sans font-semibold text-[19px] leading-[1.3] text-ink' : 'visually-hidden'
      "
    >
      {{ legend }}
    </legend>
    <div class="flex flex-col gap-[10px]">
      <label
        v-for="o in options"
        :key="o.value"
        class="flex items-center gap-[14px] min-h-[58px] bg-surface-2 border rounded-[14px] font-sans text-[17px] leading-[1.35] text-ink cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-focus-ring has-[:focus-visible]:outline-offset-2"
        :class="
          modelValue.includes(o.value)
            ? 'border-2 border-accent py-[9px] px-[17px] font-medium'
            : 'border-line-focus py-[10px] px-[18px]'
        "
      >
        <input
          type="checkbox"
          :name="name"
          :value="o.value"
          :checked="modelValue.includes(o.value)"
          class="visually-hidden"
          @change="toggle(o.value, ($event.target as HTMLInputElement).checked, modelValue, options)"
        />
        <span
          class="w-[22px] h-[22px] rounded-[6px] shrink-0 flex items-center justify-center"
          :class="modelValue.includes(o.value) ? 'bg-accent border-2 border-accent' : 'bg-surface-2 border-2 border-line-focus'"
          aria-hidden="true"
        >
          <svg v-if="modelValue.includes(o.value)" width="14" height="14" viewBox="0 0 14 14" class="block">
            <path d="M2 7.5 5.5 11 12 3.5" fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round" class="text-accent-on" />
          </svg>
        </span>
        <span class="flex flex-col gap-1">
          <span>{{ o.label }}</span>
          <span v-if="o.sublabel" class="font-sans text-[14px] leading-[1.3] text-muted">{{ o.sublabel }}</span>
        </span>
      </label>
    </div>
  </fieldset>
</template>
