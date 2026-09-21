<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'light' | 'band'
    howThisWorks?: boolean
    backTo?: string
    backLabel?: string
    shareTo?: string
  }>(),
  {
    variant: 'light',
    howThisWorks: false,
    backTo: undefined,
    backLabel: 'All areas',
    shareTo: '/share'
  }
)

const { installAvailable, promptInstall } = useInstallPrompt()
</script>

<template>
  <header
    class="flex items-center justify-between gap-4 py-[18px] px-6 rounded-[inherit]"
    :class="variant === 'band' ? 'bg-header-band text-header-band-text' : 'bg-bg text-ink'"
  >
    <div class="flex items-center gap-5">
      <NuxtLink
        v-if="backTo"
        :to="backTo"
        class="inline-flex items-center gap-[6px] min-h-11 no-underline font-sans font-medium text-[15px] leading-none"
        :class="variant === 'band' ? 'text-header-band-body' : 'text-body'"
      >
        <span aria-hidden="true">&#8592;</span> {{ backLabel }}
      </NuxtLink>
      <div class="font-sans font-bold text-[15px] leading-none tracking-[0.18em]">ANCHOR</div>
    </div>
    <div class="flex items-center gap-3">
      <button
        v-if="variant === 'light' && installAvailable"
        type="button"
        class="min-h-11 border-none bg-transparent p-0 cursor-pointer font-sans font-medium text-[15px] leading-none text-body"
        @click="promptInstall"
      >
        Install
      </button>
      <NuxtLink v-if="howThisWorks" to="/faq" class="inline-flex items-center min-h-11 font-sans font-medium text-[15px] leading-none">How this works</NuxtLink>
      <NuxtLink
        v-if="variant === 'band'"
        :to="shareTo"
        class="btn-secondary min-h-11 bg-transparent border-header-chip-outline text-header-chip-text text-[15px] hover:bg-[rgba(255,255,255,0.08)]"
      >
        Save or share
      </NuxtLink>
      <ThemeToggle />
    </div>
  </header>
</template>
