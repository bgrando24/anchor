<script setup lang="ts">
useHead({ title: "ANCHOR" });

const { canInstall } = useInstallPrompt();

// The same promise the paragraph made, in the order it actually happens. No new claims.
const steps = [
    "Tell us your Centrelink payment and any other income.",
    "Say how many bedrooms you need, and where you live now.",
    "We'll rank all 79 council areas by how much of your income the rent would take, then by what matters most to you.",
];
</script>

<template>
    <main>
        <!-- Full bleed, like the header above it. Only the words are held to the column. -->
        <section class="on-accent relative overflow-hidden bg-accent pt-2 pb-[56px]">
            <LogoMark
                :size="300"
                class="pointer-events-none absolute -right-12 -top-16 text-accent-band-mark opacity-40"
            />
            <div class="relative page dt:grid dt:grid-cols-[minmax(0,1fr)_440px] dt:gap-10 dt:items-end">
                <h1 class="m-0 display-home text-accent-on measure dt:pb-6">
                    Where in Victoria could you afford to stay?
                </h1>
            </div>
        </section>

        <div class="page pb-12 dt:grid dt:grid-cols-[minmax(0,1fr)_440px] dt:gap-10 dt:items-start">
            <div class="dt:col-start-2 dt:row-start-1 contents dt:block">
            <!-- Lifted over the band's lower edge, so the first thing under the headline is the
                 way in rather than more reading. -->
            <div
                class="relative z-10 -mt-10 p-5 dt:p-7 rounded-[18px] bg-surface border border-line shadow-[0_1px_0_var(--border),0_12px_26px_rgba(27,42,58,0.12)]"
            >
                <ol class="m-0 p-0 list-none flex flex-col gap-4">
                    <li
                        v-for="(step, i) in steps"
                        :key="i"
                        class="flex items-start gap-3 font-sans text-[17px] leading-[1.5] text-body"
                    >
                        <span
                            class="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-surface-accent-tint border border-accent figure font-semibold text-[14px] text-accent"
                            aria-hidden="true"
                        >
                            {{ i + 1 }}
                        </span>
                        <span>{{ step }}</span>
                    </li>
                </ol>

                <NuxtLink to="/income" class="btn-primary w-full mt-6">Start</NuxtLink>
                <p class="m-0 mt-3 font-sans text-[15px] leading-[1.5] text-muted text-center">
                    It takes about two minutes.
                </p>
            </div>

            </div>

            <!-- Desktop puts these beside the card rather than below it; the copy is the same
                 copy already on this page and in the FAQs. -->
            <div class="dt:col-start-1 dt:row-start-1 flex flex-col gap-4 mt-5 dt:mt-0">
                <PrivacyNote title="Your answers stay on this device">
                    Anchor works out your results in your browser. We don't have accounts and we
                    never see what you enter.
                </PrivacyNote>

                <div class="p-5 rounded-[16px] bg-surface-2 border border-line">
                    <div class="font-sans font-semibold text-[17px] leading-[1.4] text-ink mb-[6px]">
                        Where the numbers come from
                    </div>
                    <p class="m-0 font-sans text-[16px] leading-[1.5] text-body">
                        Built from public data on rents, schools, train stations and bulk-billing
                        doctors.
                    </p>
                </div>

                <div class="p-5 rounded-[16px] bg-surface-2 border border-line">
                    <div class="font-sans font-semibold text-[17px] leading-[1.4] text-ink mb-[6px]">
                        Not a listing site
                    </div>
                    <p class="m-0 font-sans text-[16px] leading-[1.5] text-body">
                        Anchor doesn't list homes. It compares areas to help you decide where to
                        look.
                    </p>
                </div>

                <InstallPrompt v-if="canInstall" />
            </div>
        </div>
    </main>
</template>
