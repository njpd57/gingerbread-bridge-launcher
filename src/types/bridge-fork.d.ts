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

export type BridgeConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'other' | 'none';
export type BridgeDataActivity = 'none' | 'in' | 'out' | 'inout' | 'dormant';

/** The real network state, from `getConnectivity()` and `connectivityChanged`. */
export interface BridgeConnectivity
{
    /** The network in use. */
    type: BridgeConnectionType;
    /** 0 to 4 while connected to Wi-Fi, otherwise null. */
    wifiLevel: number | null;
    /** 0 to 4, or null without a SIM or service. Reported on Wi-Fi too. */
    cellularLevel: number | null;
    /** As reported by Android; regular apps may never get it (One UI only reports "dormant"). */
    cellularDataActivity: BridgeDataActivity;
    /** Measured from the device's traffic on any network, while the home screen is visible. */
    dataActivity: BridgeDataActivity;
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
    | { name: 'mediaSessionChanged'; session: BridgeMediaSession | null }
    | { name: 'wifiEnabledChanged'; newValue: boolean }
    | { name: 'bluetoothEnabledChanged'; newValue: boolean }
    | { name: 'locationEnabledChanged'; newValue: boolean }
    | { name: 'connectivityChanged'; newValue: BridgeConnectivity };

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

        /** Whether Wi-Fi is on (not necessarily connected). Fires `wifiEnabledChanged`. */
        getWifiEnabled(): boolean;
        getIsBluetoothAvailable(): boolean;
        /** Fires `bluetoothEnabledChanged` (from Android 12, once the home screen gets the focus back). */
        getBluetoothEnabled(): boolean;
        /** Whether location (GPS) is on. Fires `locationEnabledChanged`. */
        getLocationEnabled(): boolean;

        /** A {@link BridgeConnectivity} as JSON. Fires `connectivityChanged`. */
        getConnectivity(): string;

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
