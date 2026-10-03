import type { AnchorAnswers } from './useAnchorState'
import { questionSteps } from './useQuestionSteps'

/**
 * What the frame around a question shows: which step it is, where back and continue go, and
 * whether continue is allowed yet.
 *
 * This lives beside the questions rather than inside each one because the frame is part of the
 * questionnaire, not part of any single question: it stays mounted while the question inside it
 * changes, so the progress bar can move rather than being torn down and built again.
 */
export interface QuestionFrame {
  currentStep: number
  backTo: string
  continueTo: string
  continueLabel: string
  continueReady: boolean
}

/** `region` is the region of the area already chosen, so back from schools lands where they were. */
export function questionFrame(
  path: string,
  answers: AnchorAnswers,
  region: string | null
): QuestionFrame | null {
  const steps = questionSteps(answers, null)
  const done = (n: number) => steps[n - 1]?.done ?? false
  const route = path.replace(/\/+$/, '') || '/'

  switch (route) {
    case '/income':
      return { currentStep: 1, backTo: '/', continueTo: '/bedrooms', continueLabel: 'Continue', continueReady: done(1) }
    case '/bedrooms':
      return { currentStep: 2, backTo: '/income', continueTo: '/location', continueLabel: 'Continue', continueReady: done(2) }
    case '/location':
      return { currentStep: 3, backTo: '/bedrooms', continueTo: '/schools', continueLabel: 'Continue', continueReady: done(3) }
    case '/location/area':
      return { currentStep: 3, backTo: '/location', continueTo: '/schools', continueLabel: 'Continue', continueReady: done(3) }
    case '/schools':
      return {
        currentStep: 4,
        // Back goes to the area list they came through, so it never lands on "we couldn't find
        // that region".
        backTo: region ? `/location/area?region=${encodeURIComponent(region)}` : '/location',
        continueTo: '/priorities',
        continueLabel: 'Continue',
        continueReady: done(4)
      }
    case '/priorities':
      // The last step has no unanswered state: the tiers always hold a value.
      return { currentStep: 5, backTo: '/schools', continueTo: '/results', continueLabel: 'Results', continueReady: true }
    default:
      return null
  }
}

/**
 * The frame for the step being answered. Both the step row and the button at the foot of the page
 * read their readiness from here, so the two can never disagree about whether a step is finished.
 */
export function useQuestionFrame() {
  const route = useRoute()
  const { answers } = useAnchorState()
  const { regionOf } = useLgaData()
  return computed(() =>
    questionFrame(route.path, answers.value, regionOf(answers.value.currentLga) ?? null)
  )
}
