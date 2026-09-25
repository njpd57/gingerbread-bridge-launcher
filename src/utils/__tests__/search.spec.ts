import { describe, expect, it } from 'vitest';
import { normalizeForSearch, searchApps } from '../search';

const apps = [
    { label: 'Cámara' },
    { label: 'Calendario' },
    { label: 'Google Calendar' },
    { label: 'Calculadora' },
    { label: 'Música' },
    { label: 'YouTube Music' },
    { label: 'Chrome' },
];

const labels = (list: { label: string }[]) => list.map(a => a.label);

describe('normalizeForSearch', () =>
{
    it('lowercases, strips accents and collapses spaces', () =>
    {
        expect(normalizeForSearch('  Cámara   Pro ')).toBe('camara pro');
        expect(normalizeForSearch('ÑANDÚ')).toBe('nandu');
    });
});

describe('searchApps', () =>
{
    it('ignores case and accents', () =>
    {
        expect(labels(searchApps(apps, 'camara'))).toEqual(['Cámara']);
        expect(labels(searchApps(apps, 'MUSICA'))).toEqual(['Música']);
    });

    it('ranks label starts, then word starts, then substrings', () =>
    {
        // "cal": Calculadora, Calendario start with it; Google Calendar has a word starting with it
        expect(labels(searchApps(apps, 'cal'))).toEqual(['Calculadora', 'Calendario', 'Google Calendar']);
        // "mus": Música starts with it, YouTube Music has a word that does
        expect(labels(searchApps(apps, 'mus'))).toEqual(['Música', 'YouTube Music']);
        // "ome": only contained in Chrome
        expect(labels(searchApps(apps, 'ome'))).toEqual(['Chrome']);
    });

    it('matches nothing for an empty or blank query', () =>
    {
        expect(searchApps(apps, '')).toEqual([]);
        expect(searchApps(apps, '   ')).toEqual([]);
    });
});
