import { encodeSavedAnswers, SAVED_ANSWERS_KEY, useAnchorState } from '~/composables/useAnchorState'

/**
 * Keeps a tab's progress through the questionnaire, so a refresh does not send someone back to
 * the first question. It is also what survives a phone discarding the page in the background,
 * which is the more common way progress was being lost.
 *
 * Session storage, so it belongs to the one tab and is gone when that tab closes. Nothing leaves
 * the device.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const { answers, restore, initialHash } = useAnchorState()

  // Read now, while it is still there: a prerendered page has had its hash cleared by the time
  // anything mounts, and a link's answers have to win over whatever this tab was part way through.
  initialHash.value = window.location.hash

  // Once the first render has settled. The questions that send you back to the start when earlier
  // answers are missing do their own restore first, so this only covers the rest.
  nuxtApp.hook('app:suspense:resolve', () => nextTick(restore))

  watch(
    answers,
    (value) => {
      try {
        sessionStorage.setItem(SAVED_ANSWERS_KEY, encodeSavedAnswers(value))
      } catch {
        // Full, blocked, or private: the questionnaire still works, it just will not survive a refresh.
      }
    },
    { deep: true }
  )
})
