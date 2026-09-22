<script setup lang="ts">
import { X } from 'lucide-vue-next'

useHead({ title: 'Where do you live now?' })

const { answers } = useAnchorState()
const { search, regionCount } = useLgaData()

onMounted(() => {
  if (answers.value.paymentType == null) navigateTo('/income')
  else if (answers.value.bedrooms == null) navigateTo('/bedrooms')
})

const query = ref('')
const matches = computed(() => search(query.value))
const searching = computed(() => query.value.trim().length > 0)

const matchOptions = computed(() =>
  matches.value.map((m) => ({ value: m.lga_code, label: m.lga_name, sublabel: `${m.area} · ${m.region}` }))
)

function selectMatch(code: string | number) {
  answers.value.currentLga = Number(code)
}

function clearSearch() {
  query.value = ''
}

const canContinue = computed(() => answers.value.currentLga != null)
</script>

<template>
  <main class="max-w-[560px] mx-auto px-4 dt:px-6 pt-5 pb-10 flex flex-col gap-5">
    <ProgressBar :current-step="3" back-to="/bedrooms" />
    <h1 class="m-0 font-sans font-semibold text-[27px] leading-[1.22] text-ink tracking-[-0.01em]">
      Where do you live now?
    </h1>
    <p class="-mt-2 mb-0 font-sans text-[17px] leading-[1.5] text-body">
      We'll compare other areas with this one. It doesn't change the ranking.
    </p>

    <div class="flex flex-col gap-2">
      <label for="area-search" class="font-sans font-medium text-[16px] leading-[1.4] text-ink">
        Search for your area
      </label>
      <!-- The wrapper carries the focus ring, because the input itself is borderless (QA#12). -->
      <div
        class="min-h-[56px] px-[18px] bg-surface-2 border border-line-focus rounded-md flex items-center justify-between gap-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-focus-ring has-[:focus-visible]:outline-offset-2"
      >
        <input
          id="area-search"
          v-model="query"
          type="text"
          class="flex-1 min-w-0 border-none bg-transparent font-sans text-[18px] leading-none text-ink min-h-11 focus:outline-none"
          placeholder="Type an area name"
          autocomplete="off"
        />
        <button v-if="query" type="button" class="icon-button text-body" aria-label="Clear search" @click="clearSearch">
          <X :size="20" aria-hidden="true" />
        </button>
      </div>
    </div>

    <template v-if="searching">
      <p class="-mt-2 mb-0 font-sans text-[15px] leading-[1.45] text-muted" role="status">
        {{ matches.length === 1 ? '1 area matches' : `${matches.length} areas match` }}
      </p>

      <RadioGroup
        v-if="matches.length"
        name="area-search-result"
        legend="Matching areas"
        :options="matchOptions"
        :model-value="answers.currentLga"
        @update:model-value="selectMatch"
      />
      <p v-else class="m-0 font-sans text-[16px] leading-[1.5] text-body">
        No area matches "{{ query.trim() }}". Check the spelling, or choose a region below.
      </p>
    </template>

    <div class="flex flex-col gap-5">
      <div class="font-sans font-semibold text-[19px] leading-[1.3] text-ink">Or choose a region</div>
      <div v-for="group in REGION_GROUPS" :key="group.area" class="flex flex-col gap-[10px]">
        <div class="font-mono font-medium text-[13px] leading-none tracking-[0.1em] uppercase text-muted">
          {{ group.area }}
        </div>
        <div class="grid grid-cols-2 gap-[10px]">
          <NuxtLink
            v-for="region in group.regions"
            :key="region"
            :to="{ path: '/location/area', query: { region } }"
            class="min-h-[76px] px-[14px] py-3 text-left bg-surface-2 border border-line-focus rounded-md font-sans font-medium text-[17px] leading-[1.3] text-ink no-underline flex flex-col gap-[7px]"
          >
            {{ region }}
            <span class="font-mono text-[14px] leading-none text-muted">{{ regionCount(region) }} areas</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <NuxtLink
      to="/priorities"
      class="btn-primary"
      :class="{ 'opacity-50 pointer-events-none': !canContinue }"
      :aria-disabled="!canContinue"
      @click="!canContinue && $event.preventDefault()"
    >
      Continue
    </NuxtLink>
  </main>
</template>
