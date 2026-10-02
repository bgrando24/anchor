<script setup lang="ts">
// Native radios in a fieldset, like the priority chips: one tab stop for the group and the
// arrow keys move the choice, with no JavaScript doing the keyboard work.
defineProps<{
  modelValue: string
  options: { value: string; label: string }[]
  /** Shown above the chips. Visible on purpose: "All / 2 bed" means nothing on its own. */
  label: string
  name: string
}>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <fieldset class="m-0 p-0 border-0 min-w-0">
    <legend class="mb-[6px] p-0 font-sans font-medium text-[15px] leading-none text-ink">
      {{ label }}
    </legend>
    <div class="flex flex-wrap gap-2">
      <label
        v-for="option in options"
        :key="option.value"
        class="flex items-center justify-center min-h-11 px-[14px] rounded-[10px] font-sans text-[15px] leading-none text-center cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-focus-ring has-[:focus-visible]:outline-offset-2"
        :class="
          modelValue === option.value
            ? 'border-2 border-accent bg-surface-accent-tint font-semibold text-ink'
            : 'border border-line-focus bg-surface-2 text-ink'
        "
      >
        <input
          type="radio"
          :name="name"
          :value="option.value"
          :checked="modelValue === option.value"
          class="visually-hidden"
          @change="emit('update:modelValue', option.value)"
        />
        {{ option.label }}
      </label>
    </div>
  </fieldset>
</template>
