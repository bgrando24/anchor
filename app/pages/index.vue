<script setup lang="ts">
useHead({ title: "Where could you afford to stay?" });

const { canInstall } = useInstallPrompt();
</script>

<template>
    <div class="min-h-screen bg-bg">
        <AppHeader variant="light" how-this-works />
        <main
            class="max-w-[560px] mx-auto px-6 pt-6 pb-12 flex flex-col gap-[22px]"
        >
            <h1
                class="mt-2 font-sans font-semibold text-[34px] leading-[1.18] text-ink tracking-[-0.02em]"
            >
                Where in Victoria could you afford to stay?
            </h1>
            <div
                class="flex flex-col gap-[14px] font-sans text-[18px] leading-[1.55] text-body"
            >
                <p class="m-0">
                    Answer four short questions about your income and what
                    matters to you.
                </p>
                <p class="m-0">
                    Anchor ranks all 79 Victorian local government areas by how
                    affordable rents are on your income, and how steady that has
                    been over five years.
                </p>
                <p class="m-0">It takes about two minutes.</p>
            </div>
            <PrivacyNote />
            <div class="flex flex-col gap-[14px] mt-2">
                <NuxtLink to="/income" class="btn-primary">Start</NuxtLink>
                <p
                    class="m-0 font-sans text-[15px] leading-[1.5] text-muted text-center"
                >
                    We can't tell you where to live, only what the numbers say
                    about each area.
                </p>
            </div>
            <InstallPrompt v-if="canInstall" class="mt-2" />
        </main>
    </div>
</template>
