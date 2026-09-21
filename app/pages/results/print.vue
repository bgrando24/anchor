<script setup lang="ts">
useHead({ title: "Printable results" });

const { answers } = useAnchorState();
const requestUrl = useRequestURL();

onMounted(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const decoded = decodeAnswersFromFragment(hash);
    if (decoded) {
        answers.value = decoded;
    } else {
        navigateTo("/invalid-link");
    }
});

const scored = computed(() => useScoring().rankAll(answers.value.weights));
const top5 = computed(() => scored.value.slice(0, 5));
const leader = computed(() => scored.value[0]);

const today = computed(() =>
    new Date().toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }),
);

const shareLink = computed(
    () =>
        `${requestUrl.origin}/results${encodeAnswersToFragment(answers.value)}`,
);

function printPage() {
    window.print();
}
</script>

<template>
    <div class="min-h-screen bg-[#F2EEE8] print:bg-white">
        <div class="max-w-[720px] mx-auto py-6 px-6 print:hidden">
            <button type="button" class="btn-primary" @click="printPage">
                Print or save as PDF
            </button>
        </div>

        <div
            class="a4-sheet max-w-[720px] mx-auto bg-white text-[#1B2A3A] py-8 px-10 mb-10 flex flex-col print:mx-0 print:max-w-none print:mb-0 print:py-0 print:px-0"
        >
            <div
                class="flex justify-between items-start pb-4 border-b-2 border-[#1B2A3A]"
            >
                <div>
                    <div
                        class="font-sans font-bold text-[13px] leading-none tracking-[0.2em] text-[#1B2A3A] mb-[10px]"
                    >
                        ANCHOR
                    </div>
                    <h1
                        class="m-0 font-sans font-semibold text-[28px] leading-[1.15] text-[#1B2A3A] tracking-[-0.02em]"
                    >
                        Victorian areas, ranked for you
                    </h1>
                </div>
                <div
                    class="text-right font-mono text-[14px] leading-[1.5] text-[#6B655C] pt-1"
                >
                    {{ today }}<br />{{ top5.length }} of
                    {{ scored.length }} areas shown
                </div>
            </div>

            <div class="py-4 border-b border-[#E4DED4]">
                <div
                    class="font-mono font-medium text-[13px] leading-none tracking-[0.08em] uppercase text-[#6B655C] mb-[10px]"
                >
                    How it was weighted
                </div>
                <WeightSplitBar v-if="leader" :weights="leader.scoreWeights" />
            </div>

            <table class="w-full border-collapse mt-1">
                <thead>
                    <tr>
                        <th
                            scope="col"
                            class="text-left py-3 pr-2 pb-[10px] font-mono font-medium text-[13px] leading-none tracking-[0.08em] uppercase text-[#6B655C] w-9"
                        >
                            #
                        </th>
                        <th
                            scope="col"
                            class="text-left py-3 pr-3 pb-[10px] font-mono font-medium text-[13px] leading-none tracking-[0.08em] uppercase text-[#6B655C]"
                        >
                            Area
                        </th>
                        <th
                            scope="col"
                            class="text-left py-3 px-3 pb-[10px] font-mono font-medium text-[13px] leading-none tracking-[0.08em] uppercase text-[#6B655C] w-[104px]"
                        >
                            Affordable
                        </th>
                        <th
                            scope="col"
                            class="text-left py-3 pl-3 pb-[10px] font-mono font-medium text-[13px] leading-none tracking-[0.08em] uppercase text-[#6B655C] w-[132px]"
                        >
                            Score
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="r in top5" :key="r.lga_code">
                        <td
                            class="py-[14px] pr-2 border-t border-[#E4DED4] align-top font-mono font-medium text-[18px] leading-[1.3] text-[#2F5675]"
                        >
                            {{ r.rank }}
                        </td>
                        <td
                            class="py-[14px] pr-3 border-t border-[#E4DED4] align-top"
                        >
                            <div
                                class="font-sans font-semibold text-[18px] leading-[1.3] text-[#1B2A3A]"
                            >
                                {{ r.lga_name }}
                                <span
                                    class="font-mono font-normal text-[16px] leading-[1.2] text-[#6B655C]"
                                    >{{
                                        r.region === "Metro Melbourne"
                                            ? "Metro"
                                            : "Regional"
                                    }}</span
                                >
                            </div>
                            <div
                                class="mt-[6px] font-sans text-[16px] leading-[1.45] text-[#55657A]"
                            >
                                {{
                                    explainRanking(
                                        r,
                                        answers.currentLga === r.lga_code,
                                    )
                                }}
                            </div>
                        </td>
                        <td
                            class="py-[14px] px-3 border-t border-[#E4DED4] align-top"
                        >
                            <div
                                class="font-sans font-semibold text-[18px] leading-[1.2] text-[#1B2A3A]"
                            >
                                {{ oneIn(r.affordability_pct_latest) }}
                            </div>
                            <div
                                class="mt-[5px] font-mono text-[16px] leading-none text-[#6B655C]"
                            >
                                {{ pctLabel(r.affordability_pct_latest) }}
                            </div>
                        </td>
                        <td
                            class="py-[14px] pl-3 border-t border-[#E4DED4] align-top"
                        >
                            <div
                                class="font-mono font-medium text-[16px] leading-none text-[#1B2A3A] mb-2"
                            >
                                {{ r.scores.total.toFixed(1) }} / 10
                            </div>
                            <div
                                class="h-[9px] rounded-[5px] bg-[#E4DED4] overflow-hidden"
                            >
                                <div
                                    class="h-full rounded-[5px] bg-[#2F5675]"
                                    :style="{
                                        width: r.scores.total * 10 + '%',
                                    }"
                                />
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div v-if="leader" class="mt-3 pt-3 border-t border-[#E4DED4]">
                <div class="flex justify-between items-baseline mb-1">
                    <div
                        class="font-sans font-semibold text-[17px] leading-[1.3] text-[#1B2A3A]"
                    >
                        Affordable rentals in {{ leader.lga_name }}, last five years
                    </div>
                    <div
                        class="font-mono text-[16px] leading-none text-[#6B655C]"
                    >
                        ranked {{ leader.rank }} of 79
                    </div>
                </div>
                <div
                    class="font-sans text-[16px] leading-[1.45] text-[#55657A] mb-[6px]"
                >
                    Share of new lettings affordable on your income, each
                    quarter.
                </div>
                <AffordabilityChart :series="leader.affordability_series_5yr" />
            </div>

            <div
                class="mt-auto pt-4 flex justify-end items-end gap-6 border-t border-[#E4DED4]"
            >
                <div class="text-right shrink-0">
                    <div
                        class="font-mono font-medium text-[13px] leading-none tracking-[0.08em] uppercase text-[#6B655C] mb-2"
                    >
                        Your results
                    </div>
                    <div
                        class="font-mono text-[16px] leading-[1.4] text-[#2F5675] break-all"
                    >
                        {{ shareLink }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
@page {
    size: A4;
    margin: 16mm;
}

/* Shared components read theme variables; pin them to light so the printout ignores dark mode. */
.a4-sheet {
    --surface-2: #ffffff;
    --border: #e4ded4;
    --border-hairline: #ede8e0;
    --border-strong: #d9d2c7;
    --muted: #6b655c;
    --body: #55657a;
    --ink: #1b2a3a;
    --data-main: #2f5675;
    --data-mid: #4c7b9e;
    --data-light: #7fa8c9;
}
</style>
