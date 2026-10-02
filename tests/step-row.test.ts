import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The questionnaire's forward action has to be reachable without scrolling, so every step page
 * puts one in the step row as well as at the foot of the page. A new step that forgets it would
 * put the only way forward below the fold again, which is the thing this fixed.
 */
const PAGES = join(import.meta.dirname, '../app/pages')

function vuePages(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return vuePages(path)
    return entry.name.endsWith('.vue') ? [path] : []
  })
}

// The frame moved into QuestionPage, so a step page is now one that uses that wrapper.
const stepPages = vuePages(PAGES)
  .map((path) => ({ path, source: readFileSync(path, 'utf8') }))
  .filter((page) => page.source.includes('<QuestionPage'))

const WRAPPER = readFileSync(join(import.meta.dirname, '../app/components/QuestionPage.vue'), 'utf8')

describe('the questionnaire step row', () => {
  it('finds the step pages', () => {
    expect(stepPages.length).toBeGreaterThanOrEqual(5)
  })

  it('offers a way forward from the step row on every step', () => {
    for (const { path, source } of stepPages) {
      expect(source, `${path} has a ProgressBar with no continue-to`).toMatch(/continue-to=/)
    }
  })

  it('keeps the button at the foot of the page too', () => {
    for (const { path, source } of stepPages) {
      expect(source, `${path} lost its bottom button`).toMatch(/class="btn-primary"/)
    }
  })

  it('still shows the progress bar on a phone, where the step list is hidden', () => {
    expect(WRAPPER).toContain('<ProgressBar')
    expect(WRAPPER).toMatch(/dt:hidden[\s\S]{0,200}<ProgressBar/)
  })

  it('hands the bar everything the page gave it', () => {
    for (const prop of [':current-step="currentStep"', ':back-to="backTo"', ':continue-to="continueTo"', ':continue-ready="continueReady"']) {
      expect(WRAPPER, `the wrapper drops ${prop}`).toContain(prop)
    }
  })

  it('shows the step list only where there is room beside the question', () => {
    expect(WRAPPER).toMatch(/hidden dt:block[\s\S]{0,160}<StepList/)
  })

  it('ties the step-row button to the same readiness as the page', () => {
    // A step that can block progress must block both buttons, or the top one would walk past a
    // question the bottom one refuses to.
    for (const { path, source } of stepPages) {
      if (!source.includes('canContinue')) continue
      expect(source, `${path} gates its bottom button but not the step row`).toMatch(
        /:continue-ready="canContinue"/
      )
    }
  })
})
