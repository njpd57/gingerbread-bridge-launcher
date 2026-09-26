import { BridgeMock } from '@bridgelauncher/api-mock';
import type { BridgeDefaultAppRole, BridgeGetNotificationsResponse, BridgeScreenOrientation } from '@/types/bridge-fork';

// a couple of notifications for the Gingerbread status bar in the browser
const MOCK_NOTIFICATIONS: BridgeGetNotificationsResponse = {
    notifications: [
        {
            key: '0|com.google.android.gm|1|null|10001', packageName: 'com.google.android.gm', postTime: Date.now() - 60_000,
            title: 'Nuevo correo', text: 'Hola, ¿cómo va el launcher?', subText: null, category: 'email',
            isOngoing: false, isClearable: true, isGroupSummary: false, hasLargeIcon: false,
        },
        {
            key: '0|com.whatsapp|1|null|10002', packageName: 'com.whatsapp', postTime: Date.now() - 300_000,
            title: 'Ana', text: '¿Nos vemos mañana?', subText: null, category: 'msg',
            isOngoing: false, isClearable: true, isGroupSummary: false, hasLargeIcon: false,
        },
    ],
};

// a white envelope, standing in for a notification's small icon
const MOCK_NOTIFICATION_ICON = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M2 5h20v14H2z"/></svg>');

// BridgeMock plus the methods our Bridge fork adds (see src/types/bridge-fork.d.ts)
class ForkBridgeMock extends BridgeMock
{
    private screenOrientation: BridgeScreenOrientation = 'unspecified';

    getScreenOrientation()
    {
        return this.screenOrientation;
    }

    requestSetScreenOrientation(orientation: BridgeScreenOrientation)
    {
        this.screenOrientation = orientation;
        return true;
    }

    requestOpenUrl(url: string)
    {
        window.open(url, '_blank');
        return true;
    }

    getDefaultAppPackageName(role: BridgeDefaultAppRole)
    {
        const packages: Record<BridgeDefaultAppRole, string> = {
            dialer: 'com.google.android.dialer',
            browser: 'com.android.chrome',
            sms: 'com.google.android.apps.messaging',
            email: 'com.google.android.gm',
            camera: 'com.android.camera2',
        };
        return packages[role];
    }

    getCanReadNotifications()
    {
        return true;
    }

    requestOpenNotificationAccessSettings()
    {
        alert('Would open Android\'s notification access settings.');
        return true;
    }

    getNotificationsURL()
    {
        return 'data:application/json,' + encodeURIComponent(JSON.stringify(MOCK_NOTIFICATIONS));
    }

    getNotificationIconURL()
    {
        return MOCK_NOTIFICATION_ICON;
    }

    requestOpenNotification(key: string)
    {
        alert(`Would open notification ${key}.`);
        return true;
    }

    requestDismissNotification(key: string)
    {
        alert(`Would dismiss notification ${key}.`);
        return true;
    }
}

export default function injectBridgeMockInDev()
{
    if (import.meta.env.DEV && !window.Bridge)
    {
        window.Bridge = new ForkBridgeMock();
    }
}
