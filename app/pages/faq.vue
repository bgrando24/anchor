<script setup lang="ts">
import { PRIORITY_FACTORS } from '~/data/options'

useHead({ title: 'ANCHOR — how this works' })
</script>

<template>
  <div class="page">
    <main class="content">
      <NuxtLink to="/" class="back-link"><span aria-hidden="true">&#8592;</span> Home</NuxtLink>
      <h1>How this works</h1>

      <section class="block">
        <h2>What ANCHOR does</h2>
        <p>
          ANCHOR ranks Victoria's 79 local government areas by how affordable and how steady their rents have been,
          weighted by what you told us matters to you. It's a suggestion, not an answer &mdash; one input into a big
          decision, not a verdict.
        </p>
      </section>

      <section class="block">
        <h2>Rent affordability is always half the score</h2>
        <p>
          It's fixed at 50% and can't be changed, because being able to pay the rent is the point of this tool. We
          measure it as the share of new rental lettings that would cost you 30% or less of your income &mdash; the
          standard affordability benchmark &mdash; and how steady that share has been over five years.
        </p>
      </section>

      <section class="block">
        <h2>The other half is yours to weigh</h2>
        <div class="factor-list">
          <div v-for="f in PRIORITY_FACTORS" :key="f.key" class="factor-item">
            <div class="factor-name">{{ f.label }}</div>
            <div class="factor-desc">{{ f.description }}</div>
          </div>
        </div>
        <p>
          Telling us something matters "a lot" gives it more of the remaining half of the score; "not much" gives it
          less. There's no wrong answer &mdash; it just changes how areas get ranked for you.
        </p>
      </section>

      <section class="block">
        <h2>When we don't have data</h2>
        <p>
          Parks, open space and sports facility data only covers metro Melbourne. When that's true for an area, we
          say so plainly and leave that factor out of the score entirely &mdash; never as a zero, never hidden.
        </p>
      </section>

      <section class="block">
        <h2>Your privacy</h2>
        <p>
          There's no account, no sign-up, and nothing you enter is sent anywhere. All the working out happens on
          your device. If you save or share your results, your answers travel as short codes in the link itself
          &mdash; nothing that identifies you.
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
}

.content {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 24px 48px;
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.back-link {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  font: 500 15px/1 var(--font-sans);
  text-decoration: none;
  color: var(--body);
}

h1 {
  margin: 0;
  font: 600 32px/1.18 var(--font-sans);
  color: var(--ink);
  letter-spacing: -0.02em;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

h2 {
  margin: 0;
  font: 600 21px/1.3 var(--font-sans);
  color: var(--ink);
}

p {
  margin: 0;
  font: 400 17px/1.55 var(--font-sans);
  color: var(--body);
}

.factor-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 4px 0 6px;
}

.factor-item {
  padding: 14px 16px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.factor-name {
  font: 600 17px/1.3 var(--font-sans);
  color: var(--ink);
  margin-bottom: 3px;
}

.factor-desc {
  font: 400 16px/1.4 var(--font-sans);
  color: var(--body);
}
</style>
