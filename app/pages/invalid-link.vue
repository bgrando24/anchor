<script setup lang="ts">
useHead({ title: "Link not recognised" });

function startOver() {
    useAnchorState().reset();
    navigateTo("/");
}
</script>

<template>
    <div class="min-h-screen bg-bg">
        <AppHeader variant="light" />
        <main
            class="max-w-[480px] mx-auto px-6 pt-10 pb-12 flex flex-col items-center text-center gap-3"
        >
            <div
                class="w-16 h-16 rounded-full bg-surface-info flex items-center justify-center mb-2"
            >
                <div
                    class="w-[26px] h-[26px] rounded-full border-[3px] border-surface-info-text flex items-center justify-center font-sans font-semibold text-[15px] leading-none text-surface-info-text"
                >
                    !
                </div>
            </div>
            <h1
                class="m-0 font-sans font-semibold text-[25px] leading-[1.3] text-ink tracking-[-0.01em]"
            >
                This link doesn't look right.
            </h1>
            <p
                class="m-0 font-sans text-[17px] leading-[1.55] text-body max-w-[36ch]"
            >
                It may have been cut short when it was copied or sent, or it's
                from an older version of Anchor. We can't rebuild results from
                it.
            </p>
            <button
                type="button"
                class="btn-primary w-full mt-4"
                @click="startOver"
            >
                Start over
            </button>
            <p class="m-0 font-sans text-[15px] leading-[1.5] text-muted mt-2">
                Nothing was lost: your results were never stored anywhere. Starting over takes about two minutes.
            </p>
        </main>
    </div>
</template>
