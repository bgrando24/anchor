import { weeklyIncome } from '~/data/payments'
import { rankAreas, type Bedrooms, type ScoredLga } from './useScoring'

/** The ranked list for the answers currently in state. */
export function useResults() {
  const { answers } = useAnchorState()
  const { all } = useLgaData()

  const income = computed(() => weeklyIncome(answers.value.paymentType, answers.value.incomeBand))
  const bedrooms = computed<Bedrooms>(() => answers.value.bedrooms ?? 2)

  const scored = computed<ScoredLga[]>(() =>
    rankAreas(all, {
      weeklyIncome: income.value,
      bedrooms: bedrooms.value,
      weights: answers.value.weights
    })
  )

  function byCode(code: number | null | undefined) {
    if (code == null) return undefined
    return scored.value.find((s) => s.lga_code === code)
  }

  return { answers, scored, income, bedrooms, byCode }
}

/**
 * Restores answers from the URL fragment on mount and whenever it changes (QA#24), so following
 * a second share link in the same tab updates the page instead of leaving stale answers on screen.
 */
export function useFragmentSync() {
  const { answers } = useAnchorState()
  const route = useRoute()

  // Captured during setup: the router has not yet resolved the route, and by the time the page
  // mounts window.location.hash has been cleared on a prerendered page.
  const initialHash = import.meta.client ? window.location.hash : ''

  function read(hash: string) {
    if (!hash) return
    const decoded = decodeAnswersFromFragment(hash)
    if (decoded) answers.value = decoded
    else navigateTo('/invalid-link')
  }

  function readCurrent() {
    read(window.location.hash)
  }

  onMounted(() => {
    read(initialHash || route.hash || window.location.hash)
    watch(
      () => route.hash,
      (hash) => read(hash)
    )
    window.addEventListener('hashchange', readCurrent)
  })
  onBeforeUnmount(() => window.removeEventListener('hashchange', readCurrent))
}
