/**
 * OneSignal push notification integration.
 * Uses the CDN-loaded OneSignalSDK (window.OneSignalDeferred).
 */

const ONESIGNAL_APP_ID = 'd8981f9d-031f-4afb-8158-3e4f557eea5a'

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalApi) => void | Promise<void>>
  }
}

interface OneSignalApi {
  init: (config: { appId: string; serviceWorkerPath?: string; allowLocalhostAsSecureOrigin?: boolean }) => Promise<void>
  Notifications: {
    requestPermission: () => Promise<void>
    permission: boolean
  }
}

export function initOneSignal(): void {
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: import.meta.env.DEV,
    })
  })
}

export function requestNotificationPermission(): void {
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.Notifications.requestPermission()
  })
}

export function hasNotificationPermission(): boolean {
  // Check if Notification API is available
  if (typeof Notification === 'undefined') return false
  return Notification.permission === 'granted'
}
