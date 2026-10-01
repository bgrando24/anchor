<script setup lang="ts">
useHead({ title: "ANCHOR" });

const { canInstall } = useInstallPrompt();
</script>

<template>
    <main
        class="max-w-[560px] mx-auto px-4 dt:px-6 pt-6 pb-12 flex flex-col gap-[22px]"
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
                Tell us your Centrelink payment, any other income and how many
                bedrooms you need. We'll rank all 79 council areas in Victoria
                by how much of your income the rent would take.
            </p>
            <p class="m-0">It takes about two minutes.</p>
        </div>

        <div class="py-[18px] px-5 bg-surface-info rounded-md">
            <div
                class="font-sans font-semibold text-[17px] leading-[1.4] text-ink mb-[6px]"
            >
                Your answers stay on this device
            </div>
            <div class="font-sans text-[16px] leading-[1.5] text-body">
                Anchor works out your results in your browser. We don't have
                accounts and we never see what you enter.
            </div>
        </div>

        <div class="flex flex-col gap-[14px] mt-2">
            <NuxtLink to="/income" class="btn-primary">Start</NuxtLink>
            <p
                class="m-0 font-sans text-[15px] leading-[1.5] text-muted text-center"
            >
                Results are based on public rent, school, transport and health
                data.
            </p>
        </div>

        <InstallPrompt v-if="canInstall" class="mt-2" />
    </main>
</template>
