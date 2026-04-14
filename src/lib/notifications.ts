/**
 * OneSignal push notification integration.
 * Uses the CDN-loaded OneSignalSDK (window.OneSignalDeferred).
 */

const ONESIGNAL_APP_ID = 'd8981f9d-031f-4afb-8158-3e4f557eea5a'
const BASE_PATH = '/Sai-Bhajan-Quiz/'

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalApi) => void | Promise<void>>
  }
}

interface OneSignalApi {
  init: (config: {
    appId: string
    serviceWorkerPath?: string
    serviceWorkerParam?: { scope: string }
    allowLocalhostAsSecureOrigin?: boolean
  }) => Promise<void>
  Notifications: {
    requestPermission: () => Promise<void>
    permission: boolean
  }
  User?: {
    PushSubscription?: {
      id?: string
      optedIn?: boolean
    }
  }
}

export function initOneSignal(): void {
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async (OneSignal) => {
    try {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        serviceWorkerPath: `${BASE_PATH}OneSignalSDKWorker.js`,
        serviceWorkerParam: { scope: BASE_PATH },
        allowLocalhostAsSecureOrigin: import.meta.env.DEV,
      })
      console.log('[OneSignal] init success')
    } catch (err) {
      console.error('[OneSignal] init failed', err)
    }
  })
}

export function requestNotificationPermission(): void {
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async (OneSignal) => {
    try {
      await OneSignal.Notifications.requestPermission()
      console.log(
        '[OneSignal] permission requested',
        'subscriptionId:', OneSignal.User?.PushSubscription?.id,
        'optedIn:', OneSignal.User?.PushSubscription?.optedIn,
      )
    } catch (err) {
      console.error('[OneSignal] permission request failed', err)
    }
  })
}

export function hasNotificationPermission(): boolean {
  // Check if Notification API is available
  if (typeof Notification === 'undefined') return false
  return Notification.permission === 'granted'
}

export function isNotificationSupported(): boolean {
  return typeof Notification !== 'undefined' && 'serviceWorker' in navigator
}
