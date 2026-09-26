/** Launch counts per package name, kept by useAppLauncherStore. */
export type LaunchCounts = Record<string, number>;

export function recordLaunch(counts: LaunchCounts, packageName: string): LaunchCounts
{
    return { ...counts, [packageName]: (counts[packageName] ?? 0) + 1 };
}

export function forgetApp(counts: LaunchCounts, packageName: string): LaunchCounts
{
    const { [packageName]: _, ...rest } = counts;
    return rest;
}

/**
 * The most launched apps, most first. Ties go to the more recently used one, and recent apps that
 * were never counted (launched before the counter existed) fill the remaining places, so the widget
 * isn't empty at first. Apps that are no longer installed are skipped.
 */
export function mostUsedApps(
    counts: LaunchCounts,
    recent: readonly string[],
    isInstalled: (packageName: string) => boolean,
    limit: number): string[]
{
    const recency = (p: string) =>
    {
        const i = recent.indexOf(p);
        return i < 0 ? Infinity : i;
    };

    const candidates = new Set([...Object.keys(counts), ...recent]);
    return [...candidates]
        .filter(isInstalled)
        .sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0) || recency(a) - recency(b) || a.localeCompare(b))
        .slice(0, limit);
}
