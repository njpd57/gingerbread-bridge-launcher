import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useHomeLayoutStore } from '../useHomeLayoutStore';
import { useBridgeEventStore } from '../useBridgeEventStore';
import { DEFAULT_PAGE } from '../useWorkspaceStore';

describe('useHomeLayoutStore', () =>
{
    beforeEach(() =>
    {
        localStorage.clear();
        setActivePinia(createPinia());
    });

    it('starts with the clock and weather widgets on the default page', () =>
    {
        const layout = useHomeLayoutStore();
        expect(layout.items.map(i => i.id)).toEqual(['clock', 'weather']);
        expect(layout.items.every(i => i.page === DEFAULT_PAGE)).toBe(true);
    });

    it('rejects areas that overlap an item or leave the grid', () =>
    {
        const layout = useHomeLayoutStore();
        // clock covers x 1-2, y 0-1
        expect(layout.isAreaFree({ page: DEFAULT_PAGE, x: 2, y: 1, w: 1, h: 1 })).toBe(false);
        expect(layout.isAreaFree({ page: DEFAULT_PAGE, x: 0, y: 0, w: 1, h: 1 })).toBe(true);
        expect(layout.isAreaFree({ page: DEFAULT_PAGE, x: 3, y: 3, w: 2, h: 1 })).toBe(false);
        expect(layout.isAreaFree({ page: -1, x: 0, y: 0, w: 1, h: 1 })).toBe(false);
        // same cells on another page are free
        expect(layout.isAreaFree({ page: 0, x: 2, y: 1, w: 1, h: 1 })).toBe(true);
    });

    it('ignores the dragged item itself when checking a move', () =>
    {
        const layout = useHomeLayoutStore();
        expect(layout.isAreaFree({ page: DEFAULT_PAGE, x: 2, y: 0, w: 2, h: 2 }, 'clock')).toBe(true);
    });

    it('adds, moves and removes app shortcuts', () =>
    {
        const layout = useHomeLayoutStore();
        layout.addApp('com.android.chrome', 'Chrome', 0, 1, 1);
        const app = layout.items.find(i => i.type === 'app')!;
        expect(app).toMatchObject({ page: 0, x: 1, y: 1, w: 1, h: 1 });

        layout.moveItem(app.id, 4, 3, 3);
        expect(layout.items.find(i => i.id === app.id)).toMatchObject({ page: 4, x: 3, y: 3 });

        layout.removeItem(app.id);
        expect(layout.items.some(i => i.id === app.id)).toBe(false);
    });

    it('removes shortcuts when their app is uninstalled', () =>
    {
        const layout = useHomeLayoutStore();
        useBridgeEventStore();
        layout.addApp('com.android.chrome', 'Chrome', 0, 0, 0);
        layout.addApp('com.google.android.gm', 'Gmail', 0, 1, 0);

        window.onBridgeEvent!({ name: 'appRemoved', packageName: 'com.android.chrome' });

        expect(layout.items.filter(i => i.type === 'app').map(i => i.type === 'app' && i.packageName))
            .toEqual(['com.google.android.gm']);
    });
});
