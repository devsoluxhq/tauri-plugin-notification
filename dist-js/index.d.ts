export type { PermissionState } from '@tauri-apps/api/core';
/**
 * Options to send a notification.
 *
 * Platform support varies. On desktop (Windows/macOS/Linux) only `title`,
 * `body`, `icon`, and `sound` are applied; the remaining fields (`schedule`,
 * `attachments`, `actionTypeId`, `group`, `inboxLines`, `largeBody`,
 * `visibility`, `number`, `channelId`, the Android icon fields, etc.) are
 * mobile-only and are silently ignored on desktop.
 *
 * @since 2.0.0
 */
interface Options {
    /**
     * The notification identifier to reference this object later. Must be a 32-bit integer.
     */
    id?: number;
    /**
     * Identifier of the channel that delivers this notification (Android).
     *
     * If the channel does not exist, the notification won't fire. Channels are
     * managed natively by the host app; this fork's JS API does not expose
     * channel management commands.
     */
    channelId?: string;
    /**
     * Notification title.
     */
    title: string;
    /**
     * Optional notification body.
     * */
    body?: string;
    /**
     * Schedule this notification to fire on a later time or a fixed interval.
     */
    schedule?: Schedule;
    /**
     * Multiline text.
     * Changes the notification style to big text.
     * Cannot be used with `inboxLines`.
     */
    largeBody?: string;
    /**
     * Detail text for the notification with `largeBody`, `inboxLines` or `groupSummary`.
     */
    summary?: string;
    /**
     * Defines an action type for this notification.
     */
    actionTypeId?: string;
    /**
     * Identifier used to group multiple notifications.
     *
     * https://developer.apple.com/documentation/usernotifications/unmutablenotificationcontent/1649872-threadidentifier
     */
    group?: string;
    /**
     * Instructs the system that this notification is the summary of a group on Android.
     */
    groupSummary?: boolean;
    /**
     * The sound resource name or file path for the notification.
     *
     * Platform specific behavior:
     * - On macOS: use system sounds (e.g., "Ping", "Blow") or sound files in the app bundle
     * - On Linux: use XDG theme sounds (e.g., "message-new-instant") or file paths
     * - On Windows: use file paths to sound files (.wav format)
     * - On Mobile: use resource names
     */
    sound?: string;
    /**
     * List of lines to add to the notification.
     * Changes the notification style to inbox.
     * Cannot be used with `largeBody`.
     *
     * Only supports up to 5 lines.
     */
    inboxLines?: string[];
    /**
     * Notification icon.
     *
     * On Android the icon must be placed in the app's `res/drawable` folder.
     */
    icon?: string;
    /**
     * Notification large icon (Android).
     *
     * The icon must be placed in the app's `res/drawable` folder.
     */
    largeIcon?: string;
    /**
     * Icon color on Android.
     */
    iconColor?: string;
    /**
     * Notification attachments.
     */
    attachments?: Attachment[];
    /**
     * Extra payload to store in the notification.
     */
    extra?: Record<string, unknown>;
    /**
     * If true, the notification cannot be dismissed by the user on Android.
     *
     * An application service must manage the dismissal of the notification.
     * It is typically used to indicate a background task that is pending (e.g. a file download)
     * or the user is engaged with (e.g. playing music).
     */
    ongoing?: boolean;
    /**
     * Automatically cancel the notification when the user clicks on it.
     */
    autoCancel?: boolean;
    /**
     * Changes the notification presentation to be silent on iOS (no badge, no sound, not listed).
     */
    silent?: boolean;
    /**
     * Notification visibility.
     */
    visibility?: Visibility;
    /**
     * Sets the number of items this notification represents on Android.
     */
    number?: number;
}
interface ScheduleInterval {
    year?: number;
    month?: number;
    day?: number;
    /**
     * 1 - Sunday
     * 2 - Monday
     * 3 - Tuesday
     * 4 - Wednesday
     * 5 - Thursday
     * 6 - Friday
     * 7 - Saturday
     */
    weekday?: number;
    hour?: number;
    minute?: number;
    second?: number;
}
declare enum ScheduleEvery {
    Year = "year",
    Month = "month",
    TwoWeeks = "twoWeeks",
    Week = "week",
    Day = "day",
    Hour = "hour",
    Minute = "minute",
    /**
     * Not supported on iOS.
     */
    Second = "second"
}
declare class Schedule {
    at: {
        date: Date;
        repeating: boolean;
        allowWhileIdle: boolean;
    } | undefined;
    interval: {
        interval: ScheduleInterval;
        allowWhileIdle: boolean;
    } | undefined;
    every: {
        interval: ScheduleEvery;
        count: number;
        allowWhileIdle: boolean;
    } | undefined;
    static at(date: Date, repeating?: boolean, allowWhileIdle?: boolean): Schedule;
    static interval(interval: ScheduleInterval, allowWhileIdle?: boolean): Schedule;
    static every(kind: ScheduleEvery, count: number, allowWhileIdle?: boolean): Schedule;
}
/**
 * Attachment of a notification.
 */
interface Attachment {
    /** Attachment identifier. */
    id: string;
    /** Attachment URL. Accepts the `asset` and `file` protocols. */
    url: string;
}
declare enum Visibility {
    Secret = -1,
    Private = 0,
    Public = 1
}
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
declare function isPermissionGranted(): Promise<boolean>;
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
declare function requestPermission(): Promise<NotificationPermission>;
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
declare function sendNotification(options: Options | string): void;
export type { Attachment, Options, ScheduleInterval };
export { Visibility, sendNotification, requestPermission, isPermissionGranted, Schedule, ScheduleEvery };
