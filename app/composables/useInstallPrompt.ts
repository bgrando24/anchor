interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'anchor-install-dismissed'
let deferredEvent: BeforeInstallPromptEvent | null = null

// installAvailable survives a dismissal (it drives the header link); canInstall doesn't (it drives the one-off card).
export function useInstallPrompt() {
  const installAvailable = useState<boolean>('anchor-install-available', () => false)
  const canInstall = useState<boolean>('anchor-can-install', () => false)

  function wasDismissed() {
    if (!import.meta.client) return false
    return localStorage.getItem(DISMISSED_KEY) === '1'
  }

  function init() {
    if (!import.meta.client) return
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault()
      deferredEvent = event as BeforeInstallPromptEvent
      installAvailable.value = true
      canInstall.value = !wasDismissed()
    })
    window.addEventListener('appinstalled', () => {
      deferredEvent = null
      installAvailable.value = false
      canInstall.value = false
    })
  }

  async function promptInstall() {
    if (!deferredEvent) return
    await deferredEvent.prompt()
    await deferredEvent.userChoice
    deferredEvent = null
    installAvailable.value = false
    canInstall.value = false
  }

  function dismiss() {
    if (import.meta.client) localStorage.setItem(DISMISSED_KEY, '1')
    canInstall.value = false
  }

  return { installAvailable, canInstall, init, promptInstall, dismiss }
}
