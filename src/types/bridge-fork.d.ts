// Methods added by our Bridge fork (github.com/njpd57/bridge-launcher) that the published
// @bridgelauncher/api types don't declare yet. Other Bridge builds don't have them, so always
// check with bridgeHas() before calling.

import '@bridgelauncher/api';

export type BridgeScreenOrientation = 'unspecified' | 'portrait';
export type BridgeDefaultAppRole = 'dialer' | 'browser' | 'sms' | 'email' | 'camera';

/** An active notification, as served by `getNotificationsURL()` and the `notificationPosted` event. */
export interface BridgeNotification
{
    key: string;
    packageName: string;
    /** Milliseconds since the epoch. */
    postTime: number;
    title: string | null;
    text: string | null;
    subText: string | null;
    category: string | null;
    isOngoing: boolean;
    isClearable: boolean;
    /** Summary of a group of notifications from the same app; the group's notifications are also listed. */
    isGroupSummary: boolean;
    hasLargeIcon: boolean;
}

export interface BridgeGetNotificationsResponse
{
    notifications: BridgeNotification[];
}

/**
 * Events only our fork sends. Upstream's BridgeEventMap is a `type`, so it can't be augmented;
 * useBridgeEventStore hands listeners `BridgeEvent | BridgeForkEvent` instead.
 */
export type BridgeForkEvent =
    | { name: 'screenOrientationChanged'; newValue: BridgeScreenOrientation }
    | { name: 'canReadNotificationsChanged'; newValue: boolean }
    | { name: 'notificationPosted'; notification: BridgeNotification }
    | { name: 'notificationRemoved'; key: string };

declare module '@bridgelauncher/api'
{
    interface JSToBridgeAPI
    {
        /** Whether the home screen is locked to portrait (`'portrait'`) or follows the device (`'unspecified'`). */
        getScreenOrientation(): BridgeScreenOrientation;

        /** Locks the home screen to portrait, or lets it rotate again. Fires `screenOrientationChanged`. */
        requestSetScreenOrientation(orientation: BridgeScreenOrientation, showToastIfFailed?: boolean): boolean;

        /** Opens a `http`, `https`, `tel`, `mailto`, `sms`, `smsto` or `geo` URL in the app that handles it. */
        requestOpenUrl(url: string, showToastIfFailed?: boolean): boolean;

        /** Package name of the user's default app for the role, or null when there is none. */
        getDefaultAppPackageName(role: BridgeDefaultAppRole): string | null;

        /** Whether the user has given Bridge notification access. Fires `canReadNotificationsChanged`. */
        getCanReadNotifications(): boolean;

        /** Opens Android's notification access settings (Bridge's own page where possible). */
        requestOpenNotificationAccessSettings(showToastIfFailed?: boolean): boolean;

        /** URL of a {@link BridgeGetNotificationsResponse} JSON, newest first. Empty without notification access. */
        getNotificationsURL(): string;

        /** URL of the notification's small icon (a white silhouette PNG) or, with `large`, its large icon. */
        getNotificationIconURL(key: string, large?: boolean): string;

        /** Does what tapping the notification does: opens it, and dismisses it if it's auto-cancel. */
        requestOpenNotification(key: string, showToastIfFailed?: boolean): boolean;

        /** Dismisses a clearable notification. */
        requestDismissNotification(key: string, showToastIfFailed?: boolean): boolean;
    }
}
