import type { BridgeNotification } from "@/types/bridge-fork";

/**
 * The notifications to show as status bar icons: one per app (its newest), newest first, like Android's
 * status bar. Group summaries are skipped because their group's notifications are listed too.
 */
export function statusBarNotifications(notifications: Iterable<BridgeNotification>, max = 6): BridgeNotification[]
{
    const newestPerApp = new Map<string, BridgeNotification>();
    for (const n of notifications)
    {
        if (n.isGroupSummary) continue;
        const current = newestPerApp.get(n.packageName);
        if (!current || n.postTime > current.postTime)
            newestPerApp.set(n.packageName, n);
    }

    return [...newestPerApp.values()]
        .sort((a, b) => b.postTime - a.postTime)
        .slice(0, max);
}
