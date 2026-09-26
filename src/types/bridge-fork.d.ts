// Methods added by our Bridge fork (github.com/njpd57/bridge-launcher) that the published
// @bridgelauncher/api types don't declare yet. Other Bridge builds don't have them, so always
// check with bridgeHas() before calling.

import '@bridgelauncher/api';

export type BridgeScreenOrientation = 'unspecified' | 'portrait';
export type BridgeDefaultAppRole = 'dialer' | 'browser' | 'sms' | 'email' | 'camera';

/** Things projects can't toggle themselves; `requestOpenSystemPanel` opens their panel or settings screen. */
export type BridgeSystemPanel = 'wifi' | 'internet' | 'bluetooth' | 'nfc' | 'volume' | 'location';

export interface BridgeScreenBrightness
{
    isAuto: boolean;
    /** Manual brightness, 0 to 1. */
    level: number;
}

export type BridgeMediaPlaybackState = 'playing' | 'paused' | 'buffering' | 'stopped' | 'none';
export type BridgeMediaAction = 'play' | 'pause' | 'playPause' | 'next' | 'previous';

/** The media session that's playing (or was last playing), from `getMediaSession()` and `mediaSessionChanged`. */
export interface BridgeMediaSession
{
    packageName: string;
    title: string | null;
    artist: string | null;
    album: string | null;
    state: BridgeMediaPlaybackState;
    durationMs: number | null;
    /** The position at `positionUpdatedAt`; while playing, it advances at `playbackSpeed`. */
    positionMs: number | null;
    /** Milliseconds since the epoch. */
    positionUpdatedAt: number;
    playbackSpeed: number;
    hasArt: boolean;
    /** Changes with every track, like the URL from `getMediaArtURL()`. */
    artVersion: number;
    canSkipToNext: boolean;
    canSkipToPrevious: boolean;
}

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
    /** A media player's notification (it carries a media session); the launcher shows a player instead. */
    isMedia: boolean;
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
    | { name: 'notificationRemoved'; key: string }
    | { name: 'canWriteSystemSettingsChanged'; newValue: boolean }
    | { name: 'flashlightChanged'; newValue: boolean }
    | { name: 'screenBrightnessChanged'; newValue: BridgeScreenBrightness }
    | { name: 'autoRotateChanged'; newValue: boolean }
    | { name: 'masterSyncChanged'; newValue: boolean }
    | { name: 'mediaSessionChanged'; session: BridgeMediaSession | null };

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

        /** A {@link BridgeMediaSession} as JSON, or `"null"`. Needs notification access. Fires `mediaSessionChanged`. */
        getMediaSession(): string;

        /** The current track's art (404 when it has none); the URL changes with every track. */
        getMediaArtURL(): string;

        requestMediaAction(action: BridgeMediaAction, showToastIfFailed?: boolean): boolean;

        /** Opens the app that's playing, on its player screen when it says which one that is. */
        requestOpenMediaApp(showToastIfFailed?: boolean): boolean;

        /** Opens the floating panel (Android 10+) or the settings screen for something projects can't toggle. */
        requestOpenSystemPanel(panel: BridgeSystemPanel, showToastIfFailed?: boolean): boolean;

        getIsFlashlightAvailable(): boolean;
        /** Fires `flashlightChanged`. */
        getFlashlightOn(): boolean;
        requestSetFlashlightOn(on: boolean, showToastIfFailed?: boolean): boolean;

        /** Whether the user let Bridge "modify system settings", needed for brightness and auto-rotate. Fires `canWriteSystemSettingsChanged`. */
        getCanWriteSystemSettings(): boolean;
        requestOpenWriteSystemSettingsPermission(showToastIfFailed?: boolean): boolean;

        /** A {@link BridgeScreenBrightness} as JSON. Fires `screenBrightnessChanged`. */
        getScreenBrightness(): string;
        requestSetScreenBrightnessAuto(auto: boolean, showToastIfFailed?: boolean): boolean;
        /** Switches to manual brightness at `level` (0 to 1). */
        requestSetScreenBrightnessLevel(level: number, showToastIfFailed?: boolean): boolean;

        /** Fires `autoRotateChanged`. */
        getAutoRotateOn(): boolean;
        requestSetAutoRotateOn(on: boolean, showToastIfFailed?: boolean): boolean;

        /** Fires `masterSyncChanged`. */
        getMasterSyncOn(): boolean;
        requestSetMasterSyncOn(on: boolean, showToastIfFailed?: boolean): boolean;
    }
}
