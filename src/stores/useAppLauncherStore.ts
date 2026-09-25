import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { useBridgeEventStore } from "./useBridgeEventStore";

const MAX_RECENT = 8;

/**
 * Every app launch goes through here (drawer, home screen, folders, dock, search), so the launcher
 * knows which apps were used recently, for the search panel's "recent apps".
 */
export const useAppLauncherStore = defineStore('appLauncher', () =>
{
    const bridgeEvents = useBridgeEventStore();

    // most recent first
    const recent = useLocalStorage<string[]>('launcher.recentApps', []);

    function launch(packageName: string)
    {
        const ok = Bridge.requestLaunchApp(packageName, true);
        if (ok)
            recent.value = [packageName, ...recent.value.filter(p => p !== packageName)].slice(0, MAX_RECENT);
        return ok;
    }

    bridgeEvents.addEventListener(ev =>
    {
        if (ev.name === 'appRemoved')
            recent.value = recent.value.filter(p => p !== ev.packageName);
    });

    return {
        recent,
        launch,
    };
});
