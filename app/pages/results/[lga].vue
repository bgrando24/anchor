<script setup lang="ts">
const route = useRoute();
const { answers } = useAnchorState();
const { byCode } = useLgaData();

const code = computed(() => Number(route.params.lga));
const lga = computed(() => byCode(code.value));

const scored = computed(() =>
    lga.value ? useScoring().scoreOne(lga.value, answers.value.weights) : null,
);

const currentLga = computed(() =>
    answers.value.currentLga != null && answers.value.currentLga !== code.value
        ? byCode(answers.value.currentLga)
        : undefined,
);
const currentScored = computed(() =>
    currentLga.value
        ? useScoring().scoreOne(currentLga.value, answers.value.weights)
        : null,
);

const comparisonRows = computed(() =>
    scored.value && currentScored.value
        ? compareToCurrent(scored.value, currentScored.value)
        : [],
);

const viewMode = ref<"bars" | "table">("bars");

const affordabilitySentence = computed(() => {
    if (!lga.value) return "";
    const rank = affordabilityRank(lga.value);
    return rank === 1
        ? "That's the highest share of any area in Victoria."
        : `That's the ${ordinal(rank)} highest share of the 79 areas.`;
});

function ordinal(n: number): string {
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
    const mod10 = n % 10;
    if (mod10 === 1) return `${n}st`;
    if (mod10 === 2) return `${n}nd`;
    if (mod10 === 3) return `${n}rd`;
    return `${n}th`;
}

useHead({
    title: () =>
        lga.value
            ? lga.value.lga_name
            : "Area not found",
});
</script>

<template>
    <div v-if="lga && scored" class="min-h-screen bg-bg">
        <div class="bg-header-band text-header-band-text">
            <AppHeader
                variant="band"
                back-to="/results"
                back-label="All areas"
                share-to="/share"
            />
        </div>

        <div class="max-w-[1280px] mx-auto flex flex-col dt:pb-5">
            <section
                class="py-[26px] px-6 bg-surface-2 border-b border-line dt:py-[34px] dt:px-10 dt:pb-[30px] dt:grid dt:grid-cols-[1fr_420px] dt:gap-14"
            >
                <div
                    class="font-mono font-medium text-[15px] leading-none text-accent mb-[10px]"
                >
                    Ranked {{ ordinal(scored.rank) }} of 79
                </div>
                <h1
                    class="m-0 mb-[6px] font-sans font-semibold text-[32px] leading-[1.15] text-ink tracking-[-0.02em]"
                >
                    {{ lga.lga_name }}
                </h1>
                <div class="font-sans text-[16px] leading-[1.4] text-body mb-6">
                    {{ lga.region }} &middot;
                    {{ lga.population.toLocaleString() }} residents
                </div>

                <div>
                    <div
                        class="font-mono font-medium text-[13px] leading-none tracking-[0.1em] uppercase text-muted mb-[14px]"
                    >
                        Rent affordability
                    </div>
                    <div
                        class="font-sans font-semibold text-[48px] leading-none text-ink tracking-[-0.03em] mb-[10px] dt:text-[52px]"
                    >
                        {{ affordabilityHeadline(lga.affordability_pct_latest) }}
                    </div>
                    <div
                        class="font-sans text-[18px] leading-[1.5] text-body mb-[18px] dt:max-w-[40ch]"
                    >
                        rentals here were affordable on your income last
                        quarter ({{ pctLabel(lga.affordability_pct_latest) }} of
                        new lettings). {{ affordabilitySentence }}
                    </div>
                    <div class="flex gap-6 pt-[18px] border-t border-line-soft">
                        <div>
                            <div
                                class="font-mono text-[14px] leading-[1.3] text-muted mb-[6px]"
                            >
                                5-year average
                            </div>
                            <div
                                class="font-sans font-semibold text-[21px] leading-none text-ink"
                            >
                                {{ pctLabel(lga.affordability_pct_5yr_avg) }}
                            </div>
                        </div>
                        <div>
                            <div
                                class="font-mono text-[14px] leading-[1.3] text-muted mb-[6px]"
                            >
                                Steadiness
                            </div>
                            <div
                                class="font-sans font-semibold text-[21px] leading-none text-ink"
                            >
                                {{
                                    stabilityWord(
                                        lga.affordability_pct_5yr_stddev,
                                    )
                                }}
                            </div>
                        </div>
                        <div class="hidden dt:block">
                            <div
                                class="font-mono text-[14px] leading-[1.3] text-muted mb-[6px]"
                            >
                                Total score
                            </div>
                            <div
                                class="font-sans font-semibold text-[21px] leading-none text-ink"
                            >
                                {{ scored.scores.total.toFixed(1) }} / 10
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="py-[26px] px-6 pb-6 border-b border-line dt:px-10">
                <div
                    class="font-sans font-semibold text-[21px] leading-[1.3] text-ink mb-1"
                >
                    Affordable rentals, last five years
                </div>
                <div
                    class="font-sans text-[16px] leading-[1.45] text-body mb-[18px]"
                >
                    Share of new lettings affordable on your income, each
                    quarter.
                </div>
                <AffordabilityChart :series="lga.affordability_series_5yr" />
                <div
                    class="mt-[14px] font-sans text-[15px] leading-[1.5] text-body"
                >
                    {{
                        lga.affordability_pct_latest <
                        lga.affordability_pct_5yr_avg
                            ? `Down from around ${pctLabel(lga.affordability_pct_5yr_avg)} on average to ${pctLabel(lga.affordability_pct_latest)} now.`
                            : `Up from around ${pctLabel(lga.affordability_pct_5yr_avg)} on average to ${pctLabel(lga.affordability_pct_latest)} now.`
                    }}
                </div>
            </section>

            <section
                class="py-[26px] px-6 border-b border-line dt:grid dt:grid-cols-2 dt:gap-14 dt:border-b-0 dt:px-10"
            >
                <div
                    class="font-sans font-semibold text-[21px] leading-[1.3] text-ink mb-[18px] dt:col-start-1"
                >
                    What makes up the score
                </div>
                <div class="flex flex-col gap-5 dt:col-start-1">
                    <ScoreBar
                        tone="affordability"
                        label="Rent affordability"
                        :value="scored.scores.affordability"
                        :sublabel="`${pctLabel(lga.affordability_pct_latest)} of new rentals · half of the total score`"
                    />
                    <ScoreBar
                        label="Schools"
                        :value="scored.scores.schools"
                        :sublabel="`${lga.school_count} open schools`"
                    />
                    <ScoreBar
                        label="Public transport"
                        :value="scored.scores.transport"
                        :sublabel="`${lga.train_station_count} train stations`"
                    />
                    <ScoreBar
                        label="Bulk-billing doctors"
                        :value="scored.scores.gp_access"
                        :sublabel="`${Math.round(lga.gp_bulk_billing_rate * 100)}% of GP visits are bulk-billed`"
                    />
                    <MissingDataCard
                        v-if="lga.open_space_count == null"
                        label="Parks and open space"
                        note="We don't have parks data for this area, the source only covers metro Melbourne. This factor was left out of the score rather than counted as zero."
                    />
                    <MissingDataCard
                        v-if="lga.sports_facility_count == null"
                        label="Sports facilities"
                        note="Same source, same gap. Not counted in the score."
                    />
                </div>
            </section>

            <section
                v-if="currentLga && currentScored"
                id="table"
                class="p-6 bg-surface-info border-b border-line dt:px-10"
            >
                <div class="flex justify-between items-center mb-4">
                    <div
                        class="font-sans font-semibold text-[21px] leading-[1.3] text-ink"
                    >
                        Compared with {{ currentLga.lga_name }}, where you live
                        now
                    </div>
                    <div
                        class="hidden dt:flex dt:border dt:border-line-strong dt:rounded-lg dt:overflow-hidden"
                    >
                        <button
                            type="button"
                            class="dt:min-h-11 dt:px-4 dt:border-none dt:font-sans dt:font-medium dt:text-[15px] dt:leading-none dt:cursor-pointer"
                            :class="
                                viewMode === 'table'
                                    ? 'dt:bg-header-band dt:text-header-band-text'
                                    : 'dt:bg-surface-2 dt:text-body'
                            "
                            @click="viewMode = 'table'"
                        >
                            Table
                        </button>
                        <button
                            type="button"
                            class="dt:min-h-11 dt:px-4 dt:border-none dt:font-sans dt:font-medium dt:text-[15px] dt:leading-none dt:cursor-pointer"
                            :class="
                                viewMode === 'bars'
                                    ? 'dt:bg-header-band dt:text-header-band-text'
                                    : 'dt:bg-surface-2 dt:text-body'
                            "
                            @click="viewMode = 'bars'"
                        >
                            Bars
                        </button>
                    </div>
                </div>

                <div
                    class="flex flex-col gap-[14px] font-sans text-[17px] leading-[1.4]"
                    :class="{ 'dt:hidden': viewMode === 'table' }"
                >
                    <div
                        v-for="(row, i) in comparisonRows"
                        :key="row.label"
                        class="flex justify-between gap-3 pb-[14px] border-b border-line-soft"
                        :class="{
                            '!border-b-0 !pb-0':
                                i === comparisonRows.length - 1,
                        }"
                    >
                        <span class="text-body">{{ row.label }}</span>
                        <span class="text-ink font-semibold text-right">
                            {{ row.target }}<br /><span
                                class="font-normal text-muted"
                                >{{ row.current }}</span
                            >
                        </span>
                    </div>
                </div>

                <div
                    class="dt:overflow-x-auto"
                    :class="viewMode === 'table' ? 'hidden dt:block' : 'hidden'"
                >
                    <table
                        class="dt:w-full dt:border-collapse dt:font-sans dt:text-[16px] dt:leading-[1.4]"
                    >
                        <thead>
                            <tr>
                                <th
                                    scope="col"
                                    class="dt:py-[13px] dt:pr-3 dt:pl-0 dt:border-t-0 dt:text-left dt:font-mono dt:font-medium dt:text-[12px] dt:leading-none dt:tracking-[0.1em] dt:uppercase dt:text-muted"
                                >
                                    Measure
                                </th>
                                <th
                                    scope="col"
                                    class="dt:py-[13px] dt:pr-3 dt:pl-0 dt:border-t-0 dt:text-right dt:font-mono dt:font-medium dt:text-[12px] dt:leading-none dt:tracking-[0.1em] dt:uppercase dt:text-muted"
                                >
                                    {{ lga.lga_name }}
                                </th>
                                <th
                                    scope="col"
                                    class="dt:py-[13px] dt:pr-3 dt:pl-0 dt:border-t-0 dt:text-right dt:font-mono dt:font-medium dt:text-[12px] dt:leading-none dt:tracking-[0.1em] dt:uppercase dt:text-muted"
                                >
                                    {{ currentLga.lga_name }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in comparisonRows" :key="row.label">
                                <th
                                    scope="row"
                                    class="dt:py-[13px] dt:pr-3 dt:pl-0 dt:border-t dt:border-line-soft dt:text-left dt:font-sans dt:font-normal dt:text-body"
                                >
                                    {{ row.label }}
                                </th>
                                <td
                                    class="dt:py-[13px] dt:pr-3 dt:pl-0 dt:border-t dt:border-line-soft dt:text-right dt:font-mono dt:text-ink"
                                >
                                    {{ row.target }}
                                </td>
                                <td
                                    class="dt:py-[13px] dt:pr-3 dt:pl-0 dt:border-t dt:border-line-soft dt:text-right dt:font-mono dt:text-ink"
                                >
                                    {{ row.current }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section class="p-6 font-sans text-[15px] leading-[1.5] text-muted">
                <p class="m-0">
                    Rankings are a suggestion based on public data. They can't
                    account for your job, your family or your support network.
                </p>
            </section>
        </div>
    </div>
    <div v-else class="min-h-screen bg-bg">
        <div class="bg-header-band text-header-band-text">
            <AppHeader
                variant="band"
                back-to="/results"
                back-label="All areas"
            />
        </div>
        <div class="max-w-[560px] mx-auto py-10 px-6">
            <h1
                class="m-0 mb-[6px] font-sans font-semibold text-[32px] leading-[1.15] text-ink tracking-[-0.02em]"
            >
                We can't find that area
            </h1>
            <p class="font-sans text-[16px] leading-[1.4] text-body">
                The link may be out of date.
                <NuxtLink to="/results">Go back to your results.</NuxtLink>
            </p>
        </div>
    </div>
</template>
