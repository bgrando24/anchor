<script setup lang="ts">
useHead({ title: 'ANCHOR — where could you afford to stay?' })
</script>

<template>
  <div class="page">
    <AppHeader variant="light" how-this-works />
    <main class="content">
      <h1>Where in Victoria could you afford to stay?</h1>
      <div class="lede">
        <p>Answer four short questions about your income and what matters to you.</p>
        <p>
          ANCHOR ranks all 79 Victorian local government areas by how affordable rents
          are on your income, and how steady that has been over five years.
        </p>
        <p>It takes about two minutes.</p>
      </div>
      <PrivacyNote />
      <div class="actions">
        <NuxtLink to="/income" class="btn-primary">Start</NuxtLink>
        <p class="fineprint">
          We can't tell you where to live &mdash; only what the numbers say about each area.
        </p>
      </div>
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
  padding: 24px 24px 48px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

h1 {
  margin: 8px 0 0;
  font: 600 34px/1.18 var(--font-sans);
  color: var(--ink);
  letter-spacing: -0.02em;
}

.lede {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font: 400 18px/1.55 var(--font-sans);
  color: var(--body);
}

.lede p {
  margin: 0;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 8px;
}

.fineprint {
  margin: 0;
  font: 400 15px/1.5 var(--font-sans);
  color: var(--muted);
  text-align: center;
}
</style>
