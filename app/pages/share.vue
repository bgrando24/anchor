<script setup lang="ts">
useHead({ title: "Keep your results" });

const { answers } = useAnchorState();
const requestUrl = useRequestURL();

const link = computed(
    () =>
        `${requestUrl.origin}/results${encodeAnswersToFragment(answers.value)}`,
);
const printHref = computed(
    () => `/results/print${encodeAnswersToFragment(answers.value)}`,
);

const copied = ref(false);
let resetTimer: ReturnType<typeof setTimeout> | undefined;

async function copyLink() {
    try {
        await navigator.clipboard.writeText(link.value);
        copied.value = true;
        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => (copied.value = false), 2500);
    } catch {
        copied.value = false;
    }
}

async function shareLink() {
    if (navigator.share) {
        try {
            await navigator.share({
                title: "My Anchor results",
                url: link.value,
            });
        } catch {
            // share sheet dismissed
        }
    } else {
        copyLink();
    }
}

onBeforeUnmount(() => {
    if (resetTimer) clearTimeout(resetTimer);
});
</script>

<template>
    <div class="min-h-screen bg-bg">
        <main
            class="max-w-[560px] mx-auto px-6 pt-5 pb-10 flex flex-col gap-[18px]"
        >
            <button
                type="button"
                class="w-11 h-11 -ml-3 border-none bg-transparent text-body text-[22px] cursor-pointer self-start"
                aria-label="Go back"
                @click="$router.back()"
            >
                &#8592;
            </button>
            <h1
                class="m-0 font-sans font-semibold text-[27px] leading-[1.22] text-ink tracking-[-0.01em]"
            >
                Keep your results
            </h1>
            <p class="m-0 font-sans text-[17px] leading-[1.5] text-body">
                Your answers are packed into the link itself. Open it later and
                your results come back, on any device.
            </p>

            <div
                class="py-4 px-[18px] bg-surface-2 border border-line-strong rounded-md"
            >
                <div
                    class="font-mono font-medium text-[13px] leading-none tracking-[0.1em] uppercase text-muted mb-[10px]"
                >
                    Your link
                </div>
                <div
                    class="font-mono text-[15px] leading-[1.5] text-surface-info-text break-all"
                >
                    {{ link }}
                </div>
            </div>

            <div class="flex flex-col gap-3">
                <button type="button" class="btn-primary" @click="copyLink">
                    {{ copied ? "Copied" : "Copy link" }}
                </button>
                <button type="button" class="btn-secondary" @click="shareLink">
                    Share&hellip;
                </button>
                <NuxtLink :to="printHref" class="btn-secondary" target="_blank"
                    >Download as PDF</NuxtLink
                >
            </div>

            <div class="py-[18px] px-5 bg-surface-info rounded-md">
                <div
                    class="font-sans font-semibold text-[17px] leading-[1.4] text-ink mb-[6px]"
                >
                    There's nothing personal in the link.
                </div>
                <div class="font-sans text-[16px] leading-[1.5] text-body">
                    It holds your payment type, income band, areas and
                    priorities as short codes. No name, no account, nothing that
                    identifies you. Safe to send to a support worker or family.
                </div>
            </div>

            <p class="m-0 font-sans text-[15px] leading-[1.5] text-muted">
                Download as PDF opens a one-page summary in a new tab. Print it,
                or choose Save as PDF in your browser's print options. It lists
                your top five areas and leaves out your payment type and income.
            </p>
        </main>
    </div>
</template>
