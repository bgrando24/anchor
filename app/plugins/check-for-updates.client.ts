/**
 * Asks whether there is a newer version whenever the page comes back into view.
 *
 * The service worker is what makes this work offline, and the same thing makes a new release
 * slow to appear: the page is built from what was stored last time. The framework checks for a
 * new worker when the page loads, which is enough on a desktop browser.
 *
 * A phone rarely loads the page though. It suspends the tab and restores it, and a restored tab
 * has not loaded anything, so nothing asks. This asks on the way back in, which is the moment
 * someone returns to the site expecting to see what changed.
 *
 * Only a check. Whether to take the new version is left to the worker, which claims the page and
 * reloads it as it already did.
 */
export default defineNuxtPlugin(() => {
  const serviceWorker = navigator.serviceWorker
  if (!serviceWorker) return

  let checking = false
  async function check() {
    if (checking || document.hidden) return
    checking = true
    try {
      const registration = await serviceWorker.getRegistration()
      await registration?.update()
    } catch {
      // Offline, or the browser declined. There is nothing to do and nothing to say.
    } finally {
      checking = false
    }
  }

  document.addEventListener('visibilitychange', check)
  // A restored tab fires this and not visibilitychange on every phone.
  window.addEventListener('pageshow', check)
})
