import { defineStore } from "pinia";
import { ref } from "vue";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { bridgeHas } from "@/utils/bridge-utils";
import { BRIGHTNESS_LEVELS, type BrightnessStep } from "@/utils/brightness";
import type { BridgeRingerMode, BridgeScreenBrightness, BridgeSystemPanel } from "@/types/bridge-fork";

const RINGER_MODE_CYCLE: Record<BridgeRingerMode, BridgeRingerMode> = {
    normal: 'vibrate',
    vibrate: 'silent',
    silent: 'normal',
};

// System toggles our Bridge fork can change: flashlight, brightness, auto-rotate, sync and ringer
// mode. Brightness and auto-rotate need the "Modify system settings" permission, ringer mode needs
// "Do Not Disturb access"; Wi-Fi, Bluetooth and the like can only be opened as system panels.
export const useQuickSettingsStore = defineStore('quickSettings', () =>
{
    const bridgeEvents = useBridgeEventStore();

    const isSupported = bridgeHas('requestOpenSystemPanel') && bridgeHas('getScreenBrightness');

    const canWriteSystemSettings = ref(isSupported && Bridge.getCanWriteSystemSettings());
    const isFlashlightAvailable = isSupported && Bridge.getIsFlashlightAvailable();
    const flashlightOn = ref(isSupported && Bridge.getFlashlightOn());
    const brightness = ref<BridgeScreenBrightness>(isSupported
        ? JSON.parse(Bridge.getScreenBrightness())
        : { isAuto: true, level: 1 });
    const autoRotateOn = ref(isSupported && Bridge.getAutoRotateOn());
    const masterSyncOn = ref(isSupported && Bridge.getMasterSyncOn());

    // whether Wi-Fi and Bluetooth are on (read-only: apps can't toggle them)
    const supportsRadioStates = bridgeHas('getWifiEnabled') && bridgeHas('getBluetoothEnabled');
    const isBluetoothAvailable = supportsRadioStates && Bridge.getIsBluetoothAvailable();
    const wifiOn = ref(supportsRadioStates && Bridge.getWifiEnabled());
    const bluetoothOn = ref(supportsRadioStates && Bridge.getBluetoothEnabled());

    const supportsRingerMode = bridgeHas('getRingerMode') && bridgeHas('requestSetRingerMode');
    const canAccessNotificationPolicy = ref(supportsRingerMode && bridgeHas('getCanAccessNotificationPolicy') && Bridge.getCanAccessNotificationPolicy());
    const ringerMode = ref<BridgeRingerMode>(supportsRingerMode ? Bridge.getRingerMode() : 'normal');

    if (isSupported)
    {
        bridgeEvents.addEventListener(ev =>
        {
            if (ev.name === 'canWriteSystemSettingsChanged')
                canWriteSystemSettings.value = ev.newValue;
            else if (ev.name === 'flashlightChanged')
                flashlightOn.value = ev.newValue;
            else if (ev.name === 'screenBrightnessChanged')
                brightness.value = ev.newValue;
            else if (ev.name === 'autoRotateChanged')
                autoRotateOn.value = ev.newValue;
            else if (ev.name === 'masterSyncChanged')
                masterSyncOn.value = ev.newValue;
            else if (ev.name === 'wifiEnabledChanged')
                wifiOn.value = ev.newValue;
            else if (ev.name === 'bluetoothEnabledChanged')
                bluetoothOn.value = ev.newValue;
            else if (ev.name === 'ringerModeChanged')
                ringerMode.value = ev.newValue;
            else if (ev.name === 'canAccessNotificationPolicyChanged')
                canAccessNotificationPolicy.value = ev.newValue;
            // the permission is granted in Android's settings
            else if (ev.name === 'afterResume')
            {
                canWriteSystemSettings.value = Bridge.getCanWriteSystemSettings();
                if (supportsRingerMode && bridgeHas('getCanAccessNotificationPolicy'))
                    canAccessNotificationPolicy.value = Bridge.getCanAccessNotificationPolicy();
            }
        });
    }

    /** Brightness and auto-rotate need a permission; without it, explain and open its settings screen. */
    function ensureCanWriteSystemSettings()
    {
        if (canWriteSystemSettings.value) return true;
        Bridge.showToast('Permite que Bridge modifique los ajustes del sistema para cambiar el brillo y la rotación.', true);
        Bridge.requestOpenWriteSystemSettingsPermission(true);
        return false;
    }

    return {
        isSupported,
        isFlashlightAvailable,
        canWriteSystemSettings,
        flashlightOn,
        brightness,
        autoRotateOn,
        masterSyncOn,
        supportsRadioStates,
        isBluetoothAvailable,
        wifiOn,
        bluetoothOn,
        supportsRingerMode,
        canAccessNotificationPolicy,
        ringerMode,

        openPanel: (panel: BridgeSystemPanel) => Bridge.requestOpenSystemPanel(panel, true),
        toggleFlashlight: () => Bridge.requestSetFlashlightOn(!flashlightOn.value, true),
        toggleMasterSync: () => Bridge.requestSetMasterSyncOn(!masterSyncOn.value, true),
        toggleAutoRotate()
        {
            if (ensureCanWriteSystemSettings())
                Bridge.requestSetAutoRotateOn(!autoRotateOn.value, true);
        },
        setBrightness(step: BrightnessStep)
        {
            if (!ensureCanWriteSystemSettings()) return;
            if (step === 'auto')
                Bridge.requestSetScreenBrightnessAuto(true, true);
            else
                Bridge.requestSetScreenBrightnessLevel(BRIGHTNESS_LEVELS[step], true);
        },
        cycleRingerMode()
        {
            if (!canAccessNotificationPolicy.value)
            {
                Bridge.showToast('Permite que Bridge acceda a "No molestar" para cambiar el modo de sonido.', true);
                Bridge.requestOpenNotificationPolicyAccessSettings(true);
                return;
            }
            Bridge.requestSetRingerMode(RINGER_MODE_CYCLE[ringerMode.value], true);
        },
    };
});

