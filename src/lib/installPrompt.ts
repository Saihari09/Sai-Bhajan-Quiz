/**
 * Module-level storage for the deferred install prompt event.
 * Cannot be serialized to localStorage — must live in memory.
 */

let deferredPrompt: BeforeInstallPromptEvent | null = null

export function setDeferredPrompt(e: BeforeInstallPromptEvent) {
  deferredPrompt = e
}

export function getDeferredPrompt() {
  return deferredPrompt
}

export function clearDeferredPrompt() {
  deferredPrompt = null
}
