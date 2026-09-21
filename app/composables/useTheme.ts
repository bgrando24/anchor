export type Theme = 'light' | 'dark'

export function useTheme() {
  const theme = useState<Theme>('anchor-theme', () => 'light')

  function apply(t: Theme) {
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', t)
      localStorage.setItem('anchor-theme', t)
    }
  }

  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    apply(theme.value)
  }

  function init() {
    if (import.meta.client) {
      const stored = localStorage.getItem('anchor-theme')
      if (stored === 'light' || stored === 'dark') theme.value = stored
      apply(theme.value)
    }
  }

  return { theme, toggle, init }
}
