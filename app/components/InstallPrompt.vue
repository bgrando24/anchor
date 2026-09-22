<script setup lang="ts">
const { promptInstall, dismiss, isIos } = useInstallPrompt()
</script>

<template>
  <div class="flex flex-col items-center text-center gap-3 py-6 px-6 border border-line rounded-lg bg-surface-2">
    <div class="w-[72px] h-[72px] rounded-2xl bg-mark-bg text-mark-text flex items-center justify-center mb-1">
      <LogoMark :size="44" />
    </div>
    <h2 class="m-0 font-sans font-semibold text-[22px] leading-[1.25] text-ink tracking-[-0.01em]">
      Add Anchor to your home screen
    </h2>

    <!-- iOS Safari never fires beforeinstallprompt, so it gets the manual steps (QA#30). -->
    <p v-if="isIos" class="m-0 font-sans text-[16px] leading-[1.5] text-body max-w-[38ch]">
      On iPhone, tap Share, then Add to Home Screen.
    </p>
    <template v-else>
      <p class="m-0 font-sans text-[16px] leading-[1.5] text-body max-w-[38ch]">
        Open it like an app, even without internet.
      </p>
      <div class="w-full flex flex-col gap-3 mt-2">
        <button type="button" class="btn-primary" @click="promptInstall">Add to home screen</button>
        <button
          type="button"
          class="border-none bg-transparent min-h-11 font-sans font-medium text-[16px] leading-none text-muted cursor-pointer"
          @click="dismiss"
        >
          Not now
        </button>
      </div>
    </template>
  </div>
</template>
