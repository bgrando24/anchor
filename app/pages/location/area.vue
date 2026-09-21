<script setup lang="ts">
useHead({ title: "Which area?" });

const route = useRoute();
const { answers } = useAnchorState();
const { bySubregion, all } = useLgaData();

const region = computed(() => String(route.query.region ?? ""));
const areas = computed(() => bySubregion(region.value));

const sortedAll = computed(() =>
    [...all].sort((a, b) => a.lga_name.localeCompare(b.lga_name)),
);

function selectArea(code: string | number) {
    answers.value.currentLga = Number(code);
}

const canContinue = computed(() => answers.value.currentLga != null);
</script>

<template>
    <div class="min-h-screen bg-bg">
        <main
            class="max-w-[560px] mx-auto px-6 pt-5 pb-10 flex flex-col gap-[18px]"
        >
            <ProgressBar :current-step="2" back-to="/location" />

            <NuxtLink
                to="/location"
                class="inline-flex items-center gap-2 self-start py-2 px-[14px] bg-surface-info rounded-full font-sans font-medium text-[15px] leading-none text-surface-info-text no-underline"
            >
                {{ region }} <span class="opacity-75">change</span>
            </NuxtLink>
            <h1
                class="m-0 font-sans font-semibold text-[27px] leading-[1.22] text-ink tracking-[-0.01em]"
            >
                Which area?
            </h1>

            <div
                v-if="areas.length"
                class="flex flex-col gap-[10px]"
                role="radiogroup"
                :aria-label="`Which area in ${region}`"
            >
                <RadioOption
                    v-for="a in areas"
                    :key="a.lga_code"
                    name="area-choice"
                    :value="a.lga_code"
                    :label="a.lga_name"
                    :model-value="answers.currentLga"
                    @update:model-value="selectArea"
                />
            </div>
            <p v-else class="font-sans text-[16px] leading-[1.5] text-body">
                That region wasn't recognised.
                <NuxtLink to="/location">Go back and pick a region.</NuxtLink>
            </p>

            <div class="flex flex-col gap-1 mt-2">
                <div
                    class="font-sans font-semibold text-[19px] leading-[1.3] text-ink"
                >
                    Where do you work?
                </div>
                <div class="mb-2 font-sans text-[16px] leading-[1.5] text-body">
                    Optional.
                </div>
                <label class="visually-hidden" for="work-lga"
                    >Where do you work</label
                >
                <select
                    id="work-lga"
                    v-model.number="answers.workLga"
                    class="field-select"
                >
                    <option :value="null">Choose an area, or skip</option>
                    <option
                        v-for="a in sortedAll"
                        :key="a.lga_code"
                        :value="a.lga_code"
                    >
                        {{ a.lga_name }}
                    </option>
                </select>
            </div>

            <NuxtLink
                to="/priorities"
                class="btn-primary"
                :class="{ 'opacity-50 pointer-events-none': !canContinue }"
                :aria-disabled="!canContinue"
                @click="!canContinue && $event.preventDefault()"
            >
                Continue
            </NuxtLink>
        </main>
    </div>
</template>
