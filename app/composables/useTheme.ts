export type Theme = 'light' | 'dark'

export const THEME_KEY = 'anchor-theme'

/**
 * Runs in <head> before first paint, so a dark-mode user never sees the cream flash (QA#34).
 * Kept as a string because it has to be inline: no stored choice means follow the system (QA#35).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`

export function useTheme() {
  const theme = useState<Theme>('anchor-theme', () => 'light')

  function apply(t: Theme, remember: boolean) {
    if (!import.meta.client) return
    document.documentElement.setAttribute('data-theme', t)
    if (remember) {
      try {
        localStorage.setItem(THEME_KEY, t)
      } catch {
        // private browsing; the choice lasts for this page only
      }
    }
  }

  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    apply(theme.value, true)
  }

  function init() {
    if (!import.meta.client) return
    let stored: string | null = null
    try {
      stored = localStorage.getItem(THEME_KEY)
    } catch {
      stored = null
    }
    if (stored === 'light' || stored === 'dark') {
      theme.value = stored
      apply(stored, false)
      return
    }
    // No choice made yet, so follow the system and keep following it.
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const follow = () => {
      let chosen: string | null = null
      try {
        chosen = localStorage.getItem(THEME_KEY)
      } catch {
        chosen = null
      }
      if (chosen === 'light' || chosen === 'dark') return
      theme.value = media.matches ? 'dark' : 'light'
      apply(theme.value, false)
    }
    follow()
    media.addEventListener('change', follow)
  }

  return { theme, toggle, init }
}
