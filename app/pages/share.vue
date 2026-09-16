<script setup lang="ts">
useHead({ title: 'ANCHOR — keep your results' })

const { answers } = useAnchorState()
const requestUrl = useRequestURL()

const link = computed(() => {
  const params = new URLSearchParams(encodeAnswersToQuery(answers.value))
  return `${requestUrl.origin}/results?${params.toString()}`
})

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
      await navigator.share({ title: 'My ANCHOR results', url: link.value })
    } catch {
      // user cancelled the share sheet - nothing to do
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
  <div class="page">
    <main class="content">
      <button type="button" class="back-btn" aria-label="Go back" @click="$router.back()">&#8592;</button>
      <h1>Keep your results</h1>
      <p class="lede">
        Your answers are packed into the link itself. Open it later and your results come back, on any device.
      </p>

      <div class="link-box">
        <div class="link-title">Your link</div>
        <div class="link-value">{{ link }}</div>
      </div>

      <div class="actions">
        <button type="button" class="btn-primary" @click="copyLink">
          {{ copied ? 'Copied' : 'Copy link' }}
        </button>
        <button type="button" class="btn-secondary" @click="shareLink">Share&hellip;</button>
        <button type="button" class="btn-secondary" disabled title="Coming soon">Download as PDF</button>
      </div>

      <div class="privacy-box">
        <div class="privacy-title">There's nothing personal in the link.</div>
        <div class="privacy-body">
          It holds your payment type, income band, areas and priorities as short codes. No name, no account, nothing
          that identifies you. Safe to send to a support worker or family.
        </div>
      </div>

      <p class="footnote">
        The PDF is planned as the same content laid out on one page, carrying the same codes so it stays shareable
        without an account.
      </p>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
}

.content {
  max-width: 560px;
  margin: 0 auto;
  padding: 20px 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.back-btn {
  width: 44px;
  height: 44px;
  margin-left: -12px;
  border: none;
  background: none;
  color: var(--body);
  font-size: 22px;
  cursor: pointer;
  align-self: flex-start;
}

h1 {
  margin: 0;
  font: 600 27px/1.22 var(--font-sans);
  color: var(--ink);
  letter-spacing: -0.01em;
}

.lede {
  margin: 0;
  font: 400 17px/1.5 var(--font-sans);
  color: var(--body);
}

.link-box {
  padding: 16px 18px;
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
}

.link-title {
  font: 500 13px/1 var(--font-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 10px;
}

.link-value {
  font: 400 15px/1.5 var(--font-mono);
  color: var(--surface-info-text);
  word-break: break-all;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.privacy-box {
  padding: 18px 20px;
  background: var(--surface-info);
  border-radius: var(--radius-md);
}

.privacy-title {
  font: 600 17px/1.4 var(--font-sans);
  color: var(--ink);
  margin-bottom: 6px;
}

.privacy-body {
  font: 400 16px/1.5 var(--font-sans);
  color: var(--body);
}

.footnote {
  margin: 0;
  font: 400 15px/1.5 var(--font-sans);
  color: var(--muted);
}
</style>
