"use strict";
// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleEvery = exports.Schedule = exports.Visibility = void 0;
exports.sendNotification = sendNotification;
exports.requestPermission = requestPermission;
exports.isPermissionGranted = isPermissionGranted;
/**
 * Send toast notifications (brief auto-expiring OS window element) to your user.
 * Can also be used with the Notification Web API.
 *
 * @module
 */
const core_1 = require("@tauri-apps/api/core");
var ScheduleEvery;
(function (ScheduleEvery) {
    ScheduleEvery["Year"] = "year";
    ScheduleEvery["Month"] = "month";
    ScheduleEvery["TwoWeeks"] = "twoWeeks";
    ScheduleEvery["Week"] = "week";
    ScheduleEvery["Day"] = "day";
    ScheduleEvery["Hour"] = "hour";
    ScheduleEvery["Minute"] = "minute";
    /**
     * Not supported on iOS.
     */
    ScheduleEvery["Second"] = "second";
})(ScheduleEvery || (exports.ScheduleEvery = ScheduleEvery = {}));
class Schedule {
    static at(date, repeating = false, allowWhileIdle = false) {
        return {
            at: { date, repeating, allowWhileIdle },
            interval: undefined,
            every: undefined
        };
    }
    static interval(interval, allowWhileIdle = false) {
        return {
            at: undefined,
            interval: { interval, allowWhileIdle },
            every: undefined
        };
    }
    static every(kind, count, allowWhileIdle = false) {
        return {
            at: undefined,
            interval: undefined,
            every: { interval: kind, count, allowWhileIdle }
        };
    }
}
exports.Schedule = Schedule;
var Visibility;
(function (Visibility) {
    Visibility[Visibility["Secret"] = -1] = "Secret";
    Visibility[Visibility["Private"] = 0] = "Private";
    Visibility[Visibility["Public"] = 1] = "Public";
})(Visibility || (exports.Visibility = Visibility = {}));
/**
 * Checks if the permission to send notifications is granted.
 * @example
 * ```typescript
 * import { isPermissionGranted } from '@tauri-apps/plugin-notification';
 * const permissionGranted = await isPermissionGranted();
 * ```
 *
 * @since 2.0.0
 */
async function isPermissionGranted() {
    // The registered `is_permission_granted` command returns `true` / `false` /
    // `null` (the last for the prompt / not-yet-decided state). Treat the unknown
    // state as "not granted" so the return type stays an honest boolean. This
    // invokes the plugin command directly and does NOT depend on the init script
    // having patched `window.Notification`.
    return ((await (0, core_1.invoke)('plugin:notification|is_permission_granted')) ?? false);
}
/**
 * Requests the permission to send notifications.
 * @example
 * ```typescript
 * import { isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';
 * let permissionGranted = await isPermissionGranted();
 * if (!permissionGranted) {
 *   const permission = await requestPermission();
 *   permissionGranted = permission === 'granted';
 * }
 * ```
 *
 * @returns A promise resolving to whether the user granted the permission or not.
 *
 * @since 2.0.0
 */
async function requestPermission() {
    // Invoke the registered `request_permission` command directly. The plugin
    // reports a `PermissionState` ('granted' | 'denied' | 'prompt' |
    // 'prompt-with-rationale'); map the prompt states onto the Web Notification
    // API's `NotificationPermission` union ('default') so callers get a stable,
    // web-compatible value without relying on the init script.
    const permission = await (0, core_1.invoke)('plugin:notification|request_permission');
    if (permission === 'prompt' || permission === 'prompt-with-rationale') {
        return 'default';
    }
    return permission;
}
/**
 * Sends a notification to the user.
 * @example
 * ```typescript
 * import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
 * let permissionGranted = await isPermissionGranted();
 * if (!permissionGranted) {
 *   const permission = await requestPermission();
 *   permissionGranted = permission === 'granted';
 * }
 * if (permissionGranted) {
 *   sendNotification('Tauri is awesome!');
 *   sendNotification({ title: 'TAURI', body: 'Tauri is awesome!' });
 * }
 * ```
 *
 * Note: this is fire-and-forget — it returns `void` (matching the Web
 * Notification constructor) so dispatch failures cannot be awaited or caught
 * here. Use `await invoke('plugin:notification|notify', ...)` directly if you
 * need to handle errors.
 *
 * @since 2.0.0
 */
function sendNotification(options) {
    // Invoke the registered `notify` command directly rather than going through
    // the `window.Notification` constructor (which only exists once the init
    // script has patched it). The Rust `notify` command accepts `{ options }`.
    const opts = typeof options === 'string' ? { title: options } : options;
    void (0, core_1.invoke)('plugin:notification|notify', { options: opts });
}
