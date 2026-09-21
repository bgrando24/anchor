<script setup lang="ts">
import { PRIORITY_FACTORS } from "~/data/options";

useHead({ title: "What matters most to you?" });

const { answers } = useAnchorState();

const weights = computed(() => computeFactorWeights(answers.value.weights));
</script>

<template>
    <div class="min-h-screen bg-bg">
        <main
            class="max-w-[560px] mx-auto px-6 pt-5 pb-10 flex flex-col gap-[22px]"
        >
            <ProgressBar :current-step="3" back-to="/location/area" />
            <h1
                class="m-0 font-sans font-semibold text-[27px] leading-[1.22] text-ink tracking-[-0.01em]"
            >
                What matters most to you?
            </h1>
            <p class="-mt-3 mb-0 font-sans text-[17px] leading-[1.5] text-body">
                There's no right answer. This just tells us how to weigh things
                up.
            </p>

            <div class="py-[18px] px-5 bg-surface-info rounded-md">
                <div class="flex justify-between items-baseline mb-[10px]">
                    <div
                        class="font-sans font-semibold text-[18px] leading-[1.3] text-ink"
                    >
                        Rent affordability
                    </div>
                    <div
                        class="font-mono font-semibold text-[17px] leading-none text-surface-info-text"
                    >
                        Fixed at 50%
                    </div>
                </div>
                <div
                    class="h-[10px] rounded-[5px] bg-line overflow-hidden mb-3"
                >
                    <div class="w-1/2 h-full rounded-[5px] bg-data-main" />
                </div>
                <div class="font-sans text-[16px] leading-[1.5] text-body">
                    Always half the score, and you can't change it. Being able
                    to pay the rent is the point of this tool.
                </div>
            </div>

            <div class="flex flex-col gap-[22px]">
                <div v-for="f in PRIORITY_FACTORS" :key="f.key">
                    <div
                        class="font-sans font-semibold text-[19px] leading-[1.3] text-ink mb-[3px]"
                    >
                        {{ f.label }}
                    </div>
                    <div
                        class="font-sans text-[16px] leading-[1.45] text-body mb-3"
                    >
                        {{ f.description }}
                    </div>
                    <TierSelector
                        v-model="answers.weights[f.key]"
                        :label="f.label"
                    />
                </div>
            </div>

            <WeightSplitBar :weights="weights" />

            <NuxtLink to="/results" class="btn-primary">See the areas</NuxtLink>
        </main>
    </div>
</template>
