<script setup lang="ts">
useHead({ title: "Where do you live now?" });

const { answers } = useAnchorState();
const { search, subregionCount } = useLgaData();

const query = ref("");
const matches = computed(() => search(query.value));
const searching = computed(() => query.value.trim().length > 0);

function selectMatch(code: string | number) {
    answers.value.currentLga = Number(code);
}

function clearSearch() {
    query.value = "";
}

const canContinue = computed(() => answers.value.currentLga != null);
</script>

<template>
    <div class="min-h-screen bg-bg">
        <main class="max-w-[560px] mx-auto px-6 pt-5 pb-10 flex flex-col gap-5">
            <ProgressBar :current-step="2" back-to="/income" />
            <h1
                class="m-0 font-sans font-semibold text-[27px] leading-[1.22] text-ink tracking-[-0.01em]"
            >
                Where do you live now?
            </h1>
            <p class="-mt-2 mb-0 font-sans text-[17px] leading-[1.5] text-body">
                Start with the part of Victoria. Pick your area on the next
                screen.
            </p>

            <div class="flex flex-col gap-2">
                <label
                    for="area-search"
                    class="font-sans font-medium text-[16px] leading-[1.4] text-ink"
                    >Or search for your area</label
                >
                <div
                    class="min-h-[56px] px-[18px] bg-surface-2 border-2 border-surface-info-text rounded-md flex items-center justify-between gap-3"
                >
                    <input
                        id="area-search"
                        v-model="query"
                        type="text"
                        class="flex-1 border-none bg-transparent font-sans text-[18px] leading-none text-ink min-h-[44px] focus:outline-none"
                        placeholder="Start typing an area name"
                        autocomplete="off"
                    />
                    <button
                        v-if="query"
                        type="button"
                        class="w-8 h-8 border-none rounded-full bg-surface-info text-body text-[15px] cursor-pointer shrink-0"
                        aria-label="Clear search"
                        @click="clearSearch"
                    >
                        &#215;
                    </button>
                </div>
            </div>

            <template v-if="searching">
                <p
                    class="-mt-2 mb-0 font-sans text-[15px] leading-[1.45] text-muted"
                >
                    {{ matches.length }} of 79 areas match{{
                        matches.length === 1 ? "es" : ""
                    }}. You can only choose from the list.
                </p>

                <div
                    v-if="matches.length"
                    class="flex flex-col gap-[10px]"
                    role="radiogroup"
                    aria-label="Matching areas"
                >
                    <RadioOption
                        v-for="m in matches"
                        :key="m.lga_code"
                        name="area-search-result"
                        :value="m.lga_code"
                        :label="m.lga_name"
                        :sublabel="`${m.region} · ${m.subregion}`"
                        :model-value="answers.currentLga"
                        @update:model-value="selectMatch"
                    />
                </div>

                <p
                    v-else
                    class="m-0 font-sans text-[16px] leading-[1.5] text-body"
                >
                    No area is called that. Check the spelling, or browse by
                    region instead.
                </p>

                <button
                    type="button"
                    class="btn-secondary w-full"
                    @click="clearSearch"
                >
                    Browse by region instead
                </button>

                <NuxtLink
                    to="/priorities"
                    class="btn-primary"
                    :class="{ 'opacity-50 pointer-events-none': !canContinue }"
                    :aria-disabled="!canContinue"
                    @click="!canContinue && $event.preventDefault()"
                >
                    Continue
                </NuxtLink>
            </template>

            <template v-else>
                <div
                    v-for="group in REGION_GROUPS"
                    :key="group.region"
                    class="flex flex-col gap-[10px]"
                >
                    <div
                        class="font-mono font-medium text-[13px] leading-none tracking-[0.1em] uppercase text-muted"
                    >
                        {{ group.region }}
                    </div>
                    <div class="grid grid-cols-2 gap-[10px]">
                        <NuxtLink
                            v-for="sub in group.subregions"
                            :key="sub"
                            :to="{
                                path: '/location/area',
                                query: { region: sub },
                            }"
                            class="min-h-[76px] px-[14px] py-3 text-left bg-surface-2 border border-line-strong rounded-md font-sans font-medium text-[17px] leading-[1.3] text-ink no-underline flex flex-col gap-[7px]"
                        >
                            {{ sub }}
                            <span
                                class="font-mono text-[14px] leading-none text-muted"
                                >{{ subregionCount(sub) }} areas</span
                            >
                        </NuxtLink>
                    </div>
                </div>
            </template>
        </main>
    </div>
</template>
