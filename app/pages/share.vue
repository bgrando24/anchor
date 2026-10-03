<script setup lang="ts">
import { ArrowLeft, Check, Copy, Download, Share2 } from 'lucide-vue-next'

useHead({ title: 'Save or share' })

const { answers } = useAnchorState()
const requestUrl = useRequestURL()

const hasAnswers = computed(() => answersComplete(answers.value))

const link = computed(() => `${requestUrl.origin}/results${encodeAnswersToFragment(answers.value)}`)
const printHref = computed(() => `/results/print${encodeAnswersToFragment(answers.value)}`)

const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

async function copyLink() {
  try {
    await navigator.clipboard.writeText(link.value)
    copied.value = true
    if (resetTimer) clearTimeout(resetTimer)
    resetTimer = setTimeout(() => (copied.value = false), 2500)
  } catch {
    copied.value = false
  }
}

async function shareLink() {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'My Anchor results', url: link.value })
    } catch {
      // share sheet dismissed
    }
  } else {
    copyLink()
  }
}

onBeforeUnmount(() => {
  if (resetTimer) clearTimeout(resetTimer)
})
</script>

<template>
  <main class="max-w-[560px] mx-auto px-4 dt:px-6 pt-5 pb-10 flex flex-col gap-[18px]">
    <button type="button" class="icon-button -ml-3 self-start text-body" aria-label="Back" @click="$router.back()">
      <ArrowLeft :size="22" aria-hidden="true" />
    </button>

    <!-- Never offer a link the decoder would reject. -->
    <template v-if="!hasAnswers">
      <h1 class="m-0 display-question">
        Nothing to save yet
      </h1>
      <p class="m-0 font-sans text-[17px] leading-[1.5] text-body">
        Once you've answered the questions, your results will be here to copy, share or print.
      </p>
      <NuxtLink to="/income" class="btn-primary mt-2">Start</NuxtLink>
    </template>

    <template v-else>
      <h1 class="m-0 display-question">
        Save or share your results
      </h1>
      <p class="m-0 font-sans text-[17px] leading-[1.5] text-body">This link opens your results again on any device.</p>

      <div class="on-band p-5 bg-header-band rounded-[18px]">
        <div class="font-sans font-medium text-[15px] leading-none text-header-cta mb-[10px]">Your link</div>
        <div class="p-3 rounded-[10px] bg-header-chip-bg font-mono text-[15px] leading-[1.5] text-header-chip-text break-all">
          {{ link }}
        </div>
        <button
          type="button"
          class="btn-secondary w-full mt-4 gap-2 bg-header-cta border-header-cta text-on-header-cta font-semibold"
          @click="copyLink"
        >
          <component :is="copied ? Check : Copy" :size="20" aria-hidden="true" />
          {{ copied ? 'Copied' : 'Copy link' }}
        </button>
      </div>

      <!-- Two equal ways to take the results elsewhere. -->
      <div class="grid grid-cols-2 gap-3">
        <button type="button" class="btn-secondary flex-col gap-2 min-h-[92px]" @click="shareLink">
          <Share2 :size="20" aria-hidden="true" />
          Share
        </button>
        <NuxtLink :to="printHref" class="btn-secondary flex-col gap-2 min-h-[92px]" target="_blank">
          <Download :size="20" aria-hidden="true" />
          Download PDF
        </NuxtLink>
      </div>

      <PrivacyNote title="What's in the link">
        The link holds your answers as short codes: your payment, income range, bedrooms, area and
        priorities. It doesn't include your name or contact details. Only share it with people
        you're happy to tell those things.
      </PrivacyNote>

      <p class="m-0 font-sans text-[15px] leading-[1.5] text-muted">
        Download PDF opens a one-page summary you can print or save. It leaves out your payment and income.
      </p>
    </template>
  </main>
</template>
