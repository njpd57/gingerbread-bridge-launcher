/** Lowercase, without accents and with single spaces: "  Cámara  Pro " -> "camara pro". */
export function normalizeForSearch(s: string)
{
    return s
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
}

interface Searchable
{
    label: string;
}

/**
 * Apps whose label matches the query, best first: labels that start with it, then labels with a
 * word that starts with it, then labels that merely contain it; alphabetical within each group.
 * An empty query matches nothing.
 */
export function searchApps<T extends Searchable>(apps: Iterable<T>, query: string): T[]
{
    const q = normalizeForSearch(query);
    if (!q) return [];

    const scored: { app: T; rank: number }[] = [];
    for (const app of apps)
    {
        const label = normalizeForSearch(app.label);
        let rank: number;
        if (label.startsWith(q)) rank = 0;
        else if (label.split(' ').some(word => word.startsWith(q))) rank = 1;
        else if (label.includes(q)) rank = 2;
        else continue;
        scored.push({ app, rank });
    }

    return scored
        .sort((a, b) => a.rank - b.rank || a.app.label.localeCompare(b.app.label))
        .map(s => s.app);
}
