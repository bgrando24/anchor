export function useOnlineStatus() {
  const isOnline = useState<boolean>('anchor-online', () => true)

  function sync() {
    isOnline.value = navigator.onLine
  }

  function init() {
    if (import.meta.client) {
      sync()
      window.addEventListener('online', sync)
      window.addEventListener('offline', sync)
    }
  }

  return { isOnline, init }
}
