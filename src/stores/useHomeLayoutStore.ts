import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { DEFAULT_PAGE, PAGE_COUNT } from "./useWorkspaceStore";

export const GRID_COLS = 4;
export const GRID_ROWS = 4;

export type WidgetKind = 'clock' | 'weather';

export const WIDGET_SIZES: Record<WidgetKind, { w: number; h: number }> = {
    clock: { w: 2, h: 2 },
    weather: { w: 4, h: 1 },
};

export interface GridArea
{
    page: number;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface AppItem extends GridArea
{
    id: string;
    type: 'app';
    packageName: string;
    // kept so the shortcut still has a name before the app list loads
    label: string;
}

export interface WidgetItem extends GridArea
{
    id: string;
    type: 'widget';
    widget: WidgetKind;
}

export type HomeItem = AppItem | WidgetItem;

function defaultItems(): HomeItem[]
{
    return [
        { id: 'clock', type: 'widget', widget: 'clock', page: DEFAULT_PAGE, x: 1, y: 0, ...WIDGET_SIZES.clock },
        { id: 'weather', type: 'widget', widget: 'weather', page: DEFAULT_PAGE, x: 0, y: 2, ...WIDGET_SIZES.weather },
    ];
}

function newId()
{
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function overlaps(a: GridArea, b: GridArea)
{
    return a.page === b.page
        && a.x < b.x + b.w && b.x < a.x + a.w
        && a.y < b.y + b.h && b.y < a.y + a.h;
}

export const useHomeLayoutStore = defineStore('homeLayout', () =>
{
    const bridgeEvents = useBridgeEventStore();

    const items = useLocalStorage<HomeItem[]>('home.items', defaultItems());

    function isAreaFree(area: GridArea, ignoreId?: string)
    {
        const inBounds = area.page >= 0 && area.page < PAGE_COUNT
            && area.x >= 0 && area.y >= 0
            && area.x + area.w <= GRID_COLS
            && area.y + area.h <= GRID_ROWS;

        return inBounds && !items.value.some(i => i.id !== ignoreId && overlaps(i, area));
    }

    function addApp(packageName: string, label: string, page: number, x: number, y: number)
    {
        items.value = [
            ...items.value,
            { id: newId(), type: 'app', packageName, label, page, x, y, w: 1, h: 1 },
        ];
    }

    function moveItem(id: string, page: number, x: number, y: number)
    {
        items.value = items.value.map(i => i.id === id ? { ...i, page, x, y } : i);
    }

    function removeItem(id: string)
    {
        items.value = items.value.filter(i => i.id !== id);
    }

    // uninstalled apps take their shortcuts with them
    bridgeEvents.addEventListener(ev =>
    {
        if (ev.name === 'appRemoved')
            items.value = items.value.filter(i => i.type !== 'app' || i.packageName !== ev.packageName);
    });

    return {
        items,
        isAreaFree,
        addApp,
        moveItem,
        removeItem,
    };
});
