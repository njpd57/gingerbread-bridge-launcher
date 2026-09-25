import { onBeforeUnmount, ref } from "vue";

// Battery Status API; not in TypeScript's DOM types, and not available in every WebView
interface BatteryManager extends EventTarget
{
    level: number;
    charging: boolean;
}

// Network Information API; also missing from the DOM types and only partly available in WebViews
interface NetworkInformation extends EventTarget
{
    type?: string;
    effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
}

export type EffectiveConnectionType = NonNullable<NetworkInformation['effectiveType']>;

/**
 * What the WebView can tell us about the device for the Gingerbread status bar.
 * Bridge exposes none of this, so it relies on web APIs; anything unavailable stays null.
 */
export function useDeviceStatus()
{
    // 0..1, or null if the Battery Status API isn't available
    const batteryLevel = ref<number | null>(null);
    const charging = ref(false);
    const online = ref(navigator.onLine);
    // 'wifi', 'cellular', ... or null when the WebView doesn't say
    const connectionType = ref<string | null>(null);
    // the browser's estimate of connection quality, or null when unavailable
    const effectiveType = ref<EffectiveConnectionType | null>(null);

    let battery: BatteryManager | null = null;

    function readBattery()
    {
        if (!battery) return;
        batteryLevel.value = battery.level;
        charging.value = battery.charging;
    }

    const nav = navigator as Navigator & {
        getBattery?: () => Promise<BatteryManager>;
        connection?: NetworkInformation;
    };

    nav.getBattery?.()
        .then(b =>
        {
            battery = b;
            readBattery();
            b.addEventListener('levelchange', readBattery);
            b.addEventListener('chargingchange', readBattery);
        })
        .catch(() => { /* not available: keep null */ });

    function readConnection()
    {
        online.value = navigator.onLine;
        connectionType.value = nav.connection?.type ?? null;
        effectiveType.value = nav.connection?.effectiveType ?? null;
    }

    readConnection();
    window.addEventListener('online', readConnection);
    window.addEventListener('offline', readConnection);
    nav.connection?.addEventListener('change', readConnection);

    onBeforeUnmount(() =>
    {
        battery?.removeEventListener('levelchange', readBattery);
        battery?.removeEventListener('chargingchange', readBattery);
        window.removeEventListener('online', readConnection);
        window.removeEventListener('offline', readConnection);
        nav.connection?.removeEventListener('change', readConnection);
    });

    return {
        batteryLevel,
        charging,
        online,
        connectionType,
        effectiveType,
    };
}
