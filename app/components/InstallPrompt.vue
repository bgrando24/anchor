<script setup lang="ts">
const { promptInstall, dismiss } = useInstallPrompt();
</script>

<template>
    <div
        class="flex flex-col items-center text-center gap-3 py-6 px-6 border border-line rounded-lg bg-surface-2"
    >
        <div
            class="w-[72px] h-[72px] rounded-2xl bg-mark-bg flex items-center justify-center font-sans font-semibold text-[26px] leading-none text-mark-text tracking-[0.02em] mb-1"
        >
            AN
        </div>
        <h2
            class="m-0 font-sans font-semibold text-[22px] leading-[1.25] text-ink tracking-[-0.01em]"
        >
            Add Anchor to your home screen
        </h2>
        <p
            class="m-0 font-sans text-[16px] leading-[1.5] text-body max-w-[38ch]"
        >
            Opens like an app, works offline, and takes no extra space to speak
            of. No account needed either way.
        </p>
        <div class="w-full flex flex-col gap-3 mt-2">
            <button type="button" class="btn-primary" @click="promptInstall">
                Add to home screen
            </button>
            <button
                type="button"
                class="border-none bg-transparent min-h-[44px] font-sans font-medium text-[16px] leading-none text-muted cursor-pointer"
                @click="dismiss"
            >
                Not now
            </button>
        </div>
        <div
            class="w-full py-[14px] px-4 bg-surface-info rounded-md font-sans text-[14px] leading-[1.4] text-surface-info-text text-left mt-1"
        >
            If you change your mind, there's an Install link at the top of the page. We won't ask again.
        </div>
    </div>
</template>
