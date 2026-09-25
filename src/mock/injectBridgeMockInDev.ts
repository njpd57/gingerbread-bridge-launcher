import { BridgeMock } from '@bridgelauncher/api-mock';
import type { BridgeDefaultAppRole, BridgeScreenOrientation } from '@/types/bridge-fork';

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
}

export default function injectBridgeMockInDev()
{
    if (import.meta.env.DEV && !window.Bridge)
    {
        window.Bridge = new ForkBridgeMock();
    }
}
