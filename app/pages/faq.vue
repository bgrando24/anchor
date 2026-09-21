<script setup lang="ts">
useHead({ title: 'How this works' })

interface FaqItem {
  id: string
  question: string
  answer: string
}

const items: FaqItem[] = [
  {
    id: 'affordable',
    question: 'What counts as "affordable"?',
    answer:
      "A rental is affordable if the rent is no more than 30% of your gross income. That's the standard benchmark used across Australia, not a number we chose. We look at the rentals advertised in each area last quarter and work out what share of them clear that bar on your income."
  },
  {
    id: 'half',
    question: 'Why is affordability always half the score?',
    answer:
      "Because being able to pay the rent is what this tool is for. You can't turn it down. The other half is up to you: schools, public transport and bulk-billing doctors, weighted by how much each one matters to your family."
  },
  {
    id: 'stability',
    question: 'What does "stability" mean?',
    answer:
      "It's how much affordability has moved around over the last five years. An area can look affordable this quarter and be out of reach the next. We show the latest figure and how steady it has been, so one good quarter doesn't hide a shaky trend."
  },
  {
    id: 'sources',
    question: 'Where does the data come from?',
    answer:
      "Rents come from the Victorian Government's quarterly rental reports (DFFH). Population and disadvantage figures come from the ABS, GP bulk-billing rates from the AIHW, and offence rates from the Crime Statistics Agency. Schools and train stations come from Victorian Government open data."
  },
  {
    id: 'missing',
    question: "Why don't some areas have parks or sports data?",
    answer:
      "The parks and sports facilities data we use only covers metro Melbourne. For regional areas we say there's no data and leave those factors out of the score. We don't guess, and we don't count it as zero."
  },
  {
    id: 'payments',
    question: 'Why can I only pick five payment types?',
    answer:
      "They're the payments the tool can model. We left out Disability Support Pension and Carer Payment on purpose: choosing one of those would tell us something about your health, and we'd rather not ask for that."
  },
  {
    id: 'listings',
    question: 'Is this like Domain or realestate.com.au?',
    answer:
      "No. Those sites list individual homes. Anchor doesn't list any properties. It compares whole areas using public data, to help you decide where to start looking. You'd still use a listing site to find a place."
  },
  {
    id: 'privacy',
    question: 'What happens to what I enter?',
    answer:
      "Nothing leaves your device. There's no account, and the working out happens in your browser. Close the tab and it's gone. The only copy that ever exists anywhere else is a results link you choose to save or send."
  }
]

const route = useRoute()
const openIndex = ref(0)

onMounted(() => {
  const i = items.findIndex((item) => `#${item.id}` === route.hash)
  if (i >= 0) {
    openIndex.value = i
    nextTick(() => document.getElementById(items[i]!.id)?.scrollIntoView())
  }
})

function toggle(i: number) {
  openIndex.value = openIndex.value === i ? -1 : i
}
</script>

<template>
  <div class="min-h-screen bg-bg">
    <main class="max-w-[640px] mx-auto px-6 pt-6 pb-12 flex flex-col gap-6">
      <NuxtLink
        to="/"
        class="self-start inline-flex items-center gap-[6px] min-h-11 font-sans font-medium text-[15px] leading-none no-underline text-body"
      >
        <span aria-hidden="true">&#8592;</span> Home
      </NuxtLink>

      <div class="flex flex-col gap-2">
        <h1 class="m-0 font-sans font-semibold text-[27px] leading-[1.22] text-ink tracking-[-0.01em]">How this works</h1>
        <p class="m-0 font-sans text-[17px] leading-[1.5] text-body">
          What each factor means, where the numbers come from, and what this tool can't tell you.
        </p>
      </div>

      <div class="flex flex-col gap-[10px]">
        <div v-for="(item, i) in items" :id="item.id" :key="item.id" class="border border-line-strong rounded-lg overflow-hidden">
          <button
            type="button"
            class="w-full flex justify-between items-center gap-4 py-4 px-[18px] text-left border-none bg-transparent cursor-pointer font-sans font-semibold text-[17px] leading-[1.35] text-ink"
            :aria-expanded="openIndex === i"
            @click="toggle(i)"
          >
            <span>{{ item.question }}</span>
            <span class="shrink-0 font-normal text-line-focus" aria-hidden="true">{{ openIndex === i ? '−' : '+' }}</span>
          </button>
          <div v-if="openIndex === i" class="pb-[18px] px-[18px] font-sans text-[16px] leading-[1.55] text-body">
            {{ item.answer }}
          </div>
        </div>
      </div>

      <div class="py-[18px] px-5 bg-surface-info rounded-md">
        <div class="font-sans font-semibold text-[17px] leading-[1.4] text-ink mb-[6px]">This is a suggestion, not an answer.</div>
        <div class="font-sans text-[16px] leading-[1.5] text-body">
          It ranks areas on the numbers it has. It can't know your job, your family, or your support network. Use it
          as one input, not a verdict.
        </div>
      </div>
    </main>
  </div>
</template>
