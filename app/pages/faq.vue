<script setup lang="ts">
import { ArrowLeft, ChevronDown } from "lucide-vue-next";

useHead({ title: "FAQs" });

const { meta } = useLgaData();

interface FaqItem {
    id: string;
    question: string;
    answer: string;
}

const items = computed<FaqItem[]>(() => [
    {
        id: "ranking",
        question: "How are areas ranked?",
        answer: "Each area gets a score. Half of it comes from how much of your income a typical rent there would take. The other half comes from schools, train stations and bulk-billing doctors, weighted by your answers. Areas are grouped by rent first, then ordered by score within each group.",
    },
    {
        id: "affordable",
        question: "What counts as affordable?",
        answer: 'Rent is usually called affordable when it\'s 30% of your income or less. We compare the typical weekly rent in each area, for the number of bedrooms you need, with your estimated income. "Typical" means the median: half of new leases cost more and half cost less.',
    },
    {
        id: "income",
        question: "How do you work out my income?",
        answer: "We add the current maximum rate of your Centrelink payment to the middle of the other-income amount you chose. Your real income may be different, so use the percentages as a guide.",
    },
    {
        id: "payments",
        question: "Why only these payments?",
        answer: "These are the payments we can estimate. We left out Disability Support Pension and Carer Payment because choosing one would reveal information about your health.",
    },
    {
        id: "missing",
        question: "Why is there no rent data for some areas?",
        answer: "Homes Victoria doesn't publish a typical rent when too few homes of that size were leased in the quarter. Those areas are listed at the end of your results.",
    },
    {
        id: "sources",
        question: "Where does the data come from?",
        answer: `Rents: Homes Victoria quarterly rental report (${meta.rentQuarter}). Schools: Victorian Department of Education, school locations 2025. Train stations: Department of Transport and Planning. Bulk-billing: Australian Institute of Health and Welfare analysis of Medicare data. Council areas: Australian Bureau of Statistics.`,
    },
    {
        id: "listings",
        question: "Is this like Domain or realestate.com.au?",
        answer: "No. Anchor doesn't list homes. It compares areas to help you decide where to look. You'd still use a listing site to find a place.",
    },
    {
        id: "privacy",
        question: "What happens to my answers?",
        answer: "They stay in your browser. There are no accounts and nothing is sent to us. If you save a link, your answers are stored in that link.",
    },
    {
        id: "limits",
        question: "What can't Anchor tell you?",
        answer: "It doesn't know about your job, your children's schools, family nearby or your health needs. Use the rankings as a starting point.",
    },
]);

const route = useRoute();
const router = useRouter();
const openIndex = ref(0);

// Opening the FAQ mid-flow must return to where the user was, without losing answers.
const cameFromApp = ref(false);
onMounted(() => {
    cameFromApp.value = router.options.history.state.back != null;
    const i = items.value.findIndex((item) => `#${item.id}` === route.hash);
    if (i >= 0) {
        openIndex.value = i;
        nextTick(() =>
            document.getElementById(items.value[i]!.id)?.scrollIntoView(),
        );
    }
});

function goBack() {
    if (cameFromApp.value) router.back();
    else navigateTo("/");
}

function toggle(i: number) {
    openIndex.value = openIndex.value === i ? -1 : i;
}
</script>

<template>
    <main
        class="max-w-[640px] mx-auto px-4 dt:px-6 pt-5 pb-12 flex flex-col gap-6"
    >
        <button
            type="button"
            class="self-start inline-flex items-center gap-2 min-h-11 -ml-2 px-2 border-none bg-transparent cursor-pointer font-sans font-medium text-[15px] leading-none text-body"
            @click="goBack"
        >
            <ArrowLeft :size="18" aria-hidden="true" />
            Back
        </button>

        <div class="flex flex-col gap-2">
            <h1
                class="m-0 font-sans font-semibold text-[27px] leading-[1.22] text-ink tracking-[-0.01em]"
            >
                How it works
            </h1>
            <p class="m-0 font-sans text-[17px] leading-[1.5] text-body">
                How the rankings work, where the data comes from, and what
                Anchor can't tell you.
            </p>
        </div>

        <div class="flex flex-col gap-[10px]">
            <div
                v-for="(item, i) in items"
                :id="item.id"
                :key="item.id"
                class="border border-line-strong rounded-lg overflow-hidden"
            >
                <button
                    type="button"
                    class="w-full flex justify-between items-center gap-4 min-h-11 py-4 px-[18px] text-left border-none bg-transparent cursor-pointer font-sans font-semibold text-[17px] leading-[1.35] text-ink"
                    :aria-expanded="openIndex === i"
                    :aria-controls="`${item.id}-answer`"
                    @click="toggle(i)"
                >
                    <span>{{ item.question }}</span>
                    <ChevronDown
                        :size="20"
                        class="shrink-0 text-body transition-transform"
                        :class="{ 'rotate-180': openIndex === i }"
                        aria-hidden="true"
                    />
                </button>
                <div
                    v-if="openIndex === i"
                    :id="`${item.id}-answer`"
                    class="pb-[18px] px-[18px] font-sans text-[16px] leading-[1.55] text-body"
                >
                    {{ item.answer }}
                </div>
            </div>
        </div>
    </main>
</template>
