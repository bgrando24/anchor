<script setup lang="ts">
import { CircleHelp } from "lucide-vue-next";

// One header on every page. Two items only, so it fits 320px on one line.
withDefaults(defineProps<{ variant?: "light" | "band" | "accent" }>(), {
    variant: "light",
});
</script>

<template>
    <header
        class="flex items-center justify-between gap-3 py-[14px] px-4 dt:px-6 print:hidden"
        :class="{
            'on-band bg-header-band text-header-band-text': variant === 'band',
            'on-accent text-accent-on': variant === 'accent',
            'bg-bg text-ink': variant === 'light',
        }"
    >
        <NuxtLink
            to="/"
            class="inline-flex items-center gap-[10px] min-h-11 no-underline text-[inherit]"
            :class="{
                'text-header-band-text': variant === 'band',
                'text-accent-on': variant === 'accent',
                'text-ink': variant === 'light',
            }"
        >
            <LogoMark :size="26" :class="variant === 'light' ? 'text-accent' : ''" />
            <span
                class="font-sans font-bold text-[15px] leading-none tracking-[0.18em]"
                >ANCHOR</span
            >
            <span class="visually-hidden">Home</span>
        </NuxtLink>

        <div class="flex items-center gap-1">
            <NuxtLink
                to="/faq"
                class="inline-flex items-center gap-[7px] min-h-11 px-2 no-underline font-sans font-medium text-[15px] leading-none"
                :class="{
                    'text-header-band-text': variant === 'band',
                    'text-accent-on': variant === 'accent',
                    'text-ink': variant === 'light',
                }"
            >
                <CircleHelp :size="20" aria-hidden="true" />
                <!-- Below 360px the label is dropped and the icon carries the accessible name. -->
                <span class="hidden min-[360px]:inline">FAQs</span>
                <span class="min-[360px]:hidden visually-hidden">FAQs</span>
            </NuxtLink>
            <ThemeToggle />
        </div>
    </header>
</template>
