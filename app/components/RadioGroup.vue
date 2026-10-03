<script setup lang="ts">
// Native radios inside a fieldset, so the group is one tab stop and the arrow keys
// move the selection without any JavaScript.
export interface RadioGroupOption {
  value: string | number
  label: string
  sublabel?: string
}

withDefaults(
  defineProps<{
    modelValue: string | number | null
    options: RadioGroupOption[]
    name: string
    legend: string
    /** Show the legend instead of hiding it from sighted users. */
    showLegend?: boolean
  }>(),
  { showLegend: false }
)

const emit = defineEmits<{ 'update:modelValue': [string | number] }>()
</script>

<template>
  <fieldset class="m-0 p-0 border-0 min-w-0">
    <legend
      :class="
        showLegend
          ? 'p-0 mb-3 font-sans font-semibold text-[19px] leading-[1.3] text-ink'
          : 'visually-hidden'
      "
    >
      {{ legend }}
    </legend>
    <div class="flex flex-col gap-[10px]">
      <label
        v-for="o in options"
        :key="o.value"
        class="motion-colors flex items-center gap-[14px] min-h-[58px] border py-[10px] px-[18px] rounded-[14px] font-sans text-[17px] leading-[1.35] text-ink cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-focus-ring has-[:focus-visible]:outline-offset-2"
        :class="
          modelValue === o.value
            ? 'border-accent bg-surface-accent-tint font-medium shadow-[inset_0_0_0_1px_var(--accent)]'
            : 'border-line-focus bg-surface-2'
        "
      >
        <input
          type="radio"
          :name="name"
          :value="o.value"
          :checked="modelValue === o.value"
          class="visually-hidden"
          @change="emit('update:modelValue', o.value)"
        />
        <span
          class="motion-colors w-[22px] h-[22px] rounded-full bg-surface-2 shrink-0"
          :class="modelValue === o.value ? 'border-[7px] border-accent' : 'border-2 border-line-focus'"
          aria-hidden="true"
        />
        <span class="flex flex-col gap-1">
          <span>{{ o.label }}</span>
          <span v-if="o.sublabel" class="font-sans text-[14px] leading-[1.3] text-muted">{{ o.sublabel }}</span>
        </span>
      </label>
    </div>
  </fieldset>
</template>
