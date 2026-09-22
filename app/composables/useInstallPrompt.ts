interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'anchor-install-dismissed'
let deferredEvent: BeforeInstallPromptEvent | null = null

export function useInstallPrompt() {
  const canInstall = useState<boolean>('anchor-can-install', () => false)
  // iOS Safari never fires beforeinstallprompt, so the card is shown there with manual steps (QA#30).
  const isIos = useState<boolean>('anchor-is-ios', () => false)

  function wasDismissed() {
    if (!import.meta.client) return false
    try {
      return localStorage.getItem(DISMISSED_KEY) === '1'
    } catch {
      return false
    }
  }

  function detectIos() {
    if (!import.meta.client) return false
    const ua = navigator.userAgent
    const iPhoneOrIPad = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
    return iPhoneOrIPad && isSafari
  }

  function isStandalone() {
    if (!import.meta.client) return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    )
  }

  function init() {
    if (!import.meta.client) return
    if (detectIos() && !isStandalone()) {
      isIos.value = true
      canInstall.value = !wasDismissed()
    }
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault()
      deferredEvent = event as BeforeInstallPromptEvent
      isIos.value = false
      canInstall.value = !wasDismissed()
    })
    window.addEventListener('appinstalled', () => {
      deferredEvent = null
      canInstall.value = false
    })
  }

  async function promptInstall() {
    if (!deferredEvent) return
    await deferredEvent.prompt()
    await deferredEvent.userChoice
    deferredEvent = null
    canInstall.value = false
  }

  function dismiss() {
    if (import.meta.client) {
      try {
        localStorage.setItem(DISMISSED_KEY, '1')
      } catch {
        // private browsing; the card simply comes back next visit
      }
    }
    canInstall.value = false
  }

  return { canInstall, isIos, init, promptInstall, dismiss }
}
