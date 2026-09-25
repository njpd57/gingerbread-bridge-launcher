// Methods added by our Bridge fork (github.com/njpd57/bridge-launcher) that the published
// @bridgelauncher/api types don't declare yet. Other Bridge builds don't have them, so always
// check with bridgeHas() before calling.

import '@bridgelauncher/api';

export type BridgeScreenOrientation = 'unspecified' | 'portrait';
export type BridgeDefaultAppRole = 'dialer' | 'browser' | 'sms' | 'email' | 'camera';

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
    }
}
