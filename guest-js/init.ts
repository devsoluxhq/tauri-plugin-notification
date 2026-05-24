// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

import { invoke } from '@tauri-apps/api/core'
import type { PermissionState } from '@tauri-apps/api/core'
import type { Options } from './index'
;(function () {
  let permissionSettable = false
  let permissionValue = 'default'

  // Reads the real permission state as a tri-state: `true` (granted) /
  // `false` (denied) / `null` (prompt — not yet decided). The bootstrap below
  // needs all three to set `window.Notification.permission` per the Web spec,
  // so this is intentionally not the boolean helper exported from `index.ts`.
  async function readPermissionState(): Promise<boolean | null> {
    // @ts-expect-error __TEMPLATE_windows__ will be replaced in rust before it's injected.
    if (window.Notification.permission !== 'default' || __TEMPLATE_windows__) {
      return window.Notification.permission === 'granted'
    }
    return await invoke<boolean | null>(
      'plugin:notification|is_permission_granted'
    )
  }

  function setNotificationPermission(value: NotificationPermission): void {
    permissionSettable = true
    // @ts-expect-error we can actually set this value on the webview
    window.Notification.permission = value
    permissionSettable = false
  }

  // This patches `window.Notification.requestPermission`, whose Web spec
  // contract resolves to a `NotificationPermission` ('default' | 'granted' |
  // 'denied'). Map the plugin's prompt states to 'default' and return that
  // mapped value — returning the raw 'prompt' / 'prompt-with-rationale' would
  // break callers that compare against the Web permission strings.
  async function requestPermission(): Promise<NotificationPermission> {
    const permission = await invoke<PermissionState>(
      'plugin:notification|request_permission'
    )
    const mapped: NotificationPermission =
      permission === 'prompt' || permission === 'prompt-with-rationale'
        ? 'default'
        : permission
    setNotificationPermission(mapped)
    return mapped
  }

  async function sendNotification(options: string | Options): Promise<void> {
    if (typeof options === 'object') {
      Object.freeze(options)
    }

    await invoke('plugin:notification|notify', {
      options:
        typeof options === 'string'
          ? {
              title: options
            }
          : options
    })
  }

  // @ts-expect-error unfortunately we can't implement the whole type, so we overwrite it with our own version
  window.Notification = function (title, options) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const opts = options || {}
    // Fire-and-forget like the Web Notification constructor, but surface invoke
    // failures instead of silently dropping the rejection (mirrors the desktop
    // Rust `[notification] failed to ...` logging).
    sendNotification(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Object.assign(opts, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        title
      })
    ).catch((error) => {
      console.error('[notification] failed to send notification', error)
    })
  }

  window.Notification.requestPermission = requestPermission

  Object.defineProperty(window.Notification, 'permission', {
    enumerable: true,
    get: () => permissionValue,
    set: (v) => {
      if (!permissionSettable) {
        throw new Error('Readonly property')
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      permissionValue = v
    }
  })

  // Prompt-state handling here intentionally differs from the module API
  // (`index.ts`): the boolean `isPermissionGranted()` exported there maps the
  // unknown/prompt state (`null`) to `false`, whereas the
  // `window.Notification.permission` property must reflect the Web spec's
  // 'default' string. Both follow the Web Notification spec for their shapes.
  void readPermissionState().then(function (response) {
    if (response === null) {
      setNotificationPermission('default')
    } else {
      setNotificationPermission(response ? 'granted' : 'denied')
    }
  })
})()
