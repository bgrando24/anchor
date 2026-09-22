<script setup lang="ts">
import { CircleHelp } from 'lucide-vue-next'

// One header on every page (QA#33). Two items only, so it fits 320px on one line (QA#15).
withDefaults(defineProps<{ variant?: 'light' | 'band' }>(), { variant: 'light' })
</script>

<template>
  <header
    class="flex items-center justify-between gap-3 py-[14px] px-4 dt:px-6 print:hidden"
    :class="variant === 'band' ? 'on-band bg-header-band text-header-band-text' : 'bg-bg text-ink'"
  >
    <NuxtLink
      to="/"
      class="inline-flex items-center gap-[10px] min-h-11 no-underline text-[inherit]"
      :class="variant === 'band' ? 'text-header-band-text' : 'text-ink'"
    >
      <LogoMark :size="26" />
      <span class="font-sans font-bold text-[15px] leading-none tracking-[0.18em]">ANCHOR</span>
      <span class="visually-hidden">Home</span>
    </NuxtLink>

    <div class="flex items-center gap-1">
      <NuxtLink
        to="/faq"
        class="inline-flex items-center gap-[7px] min-h-11 px-2 no-underline font-sans font-medium text-[15px] leading-none"
        :class="variant === 'band' ? 'text-header-band-text' : 'text-ink'"
      >
        <CircleHelp :size="20" aria-hidden="true" />
        <!-- Below 360px the label is dropped and the icon carries the accessible name. -->
        <span class="hidden min-[360px]:inline">How it works</span>
        <span class="min-[360px]:hidden visually-hidden">How it works</span>
      </NuxtLink>
      <ThemeToggle />
    </div>
  </header>
</template>
