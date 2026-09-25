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

export interface FolderApp
{
    packageName: string;
    label: string;
}

export interface FolderItem extends GridArea
{
    id: string;
    type: 'folder';
    name: string;
    apps: FolderApp[];
}

export type HomeItem = AppItem | WidgetItem | FolderItem;

export const DEFAULT_FOLDER_NAME = 'Carpeta';

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

    /** The preferred spot if it's free, otherwise the first free spot on that page (row by row), or null if the page is full. */
    function findFreeSpot(page: number, w: number, h: number, preferred?: { x: number; y: number })
    {
        if (preferred && isAreaFree({ page, x: preferred.x, y: preferred.y, w, h }))
            return { page, x: preferred.x, y: preferred.y };

        for (let y = 0; y <= GRID_ROWS - h; y++)
            for (let x = 0; x <= GRID_COLS - w; x++)
                if (isAreaFree({ page, x, y, w, h }))
                    return { page, x, y };

        return null;
    }

    function folderAt(page: number, x: number, y: number)
    {
        return items.value.find((i): i is FolderItem =>
            i.type === 'folder' && i.page === page && i.x === x && i.y === y);
    }

    function addApp(packageName: string, label: string, page: number, x: number, y: number)
    {
        items.value = [
            ...items.value,
            { id: newId(), type: 'app', packageName, label, page, x, y, w: 1, h: 1 },
        ];
    }

    function addWidget(widget: WidgetKind, page: number, x: number, y: number)
    {
        items.value = [
            ...items.value,
            { id: newId(), type: 'widget', widget, page, x, y, ...WIDGET_SIZES[widget] },
        ];
    }

    function addFolder(page: number, x: number, y: number)
    {
        const id = newId();
        items.value = [
            ...items.value,
            { id, type: 'folder', name: DEFAULT_FOLDER_NAME, apps: [], page, x, y, w: 1, h: 1 },
        ];
        return id;
    }

    function updateFolder(id: string, update: (folder: FolderItem) => FolderItem)
    {
        items.value = items.value.map(i => i.id === id && i.type === 'folder' ? update(i) : i);
    }

    function renameFolder(id: string, name: string)
    {
        updateFolder(id, f => ({ ...f, name: name.trim() || DEFAULT_FOLDER_NAME }));
    }

    function addToFolder(id: string, app: FolderApp)
    {
        updateFolder(id, f => ({ ...f, apps: [...f.apps, app] }));
    }

    function removeFromFolder(id: string, packageName: string)
    {
        // only the first match, in case the same app was added twice
        updateFolder(id, f =>
        {
            const index = f.apps.findIndex(a => a.packageName === packageName);
            return index === -1 ? f : { ...f, apps: f.apps.filter((_, i) => i !== index) };
        });
    }

    function moveItem(id: string, page: number, x: number, y: number)
    {
        items.value = items.value.map(i => i.id === id ? { ...i, page, x, y } : i);
    }

    function removeItem(id: string)
    {
        items.value = items.value.filter(i => i.id !== id);
    }

    // uninstalled apps take their shortcuts (and their place in folders) with them
    bridgeEvents.addEventListener(ev =>
    {
        if (ev.name !== 'appRemoved') return;
        items.value = items.value
            .filter(i => i.type !== 'app' || i.packageName !== ev.packageName)
            .map(i => i.type === 'folder'
                ? { ...i, apps: i.apps.filter(a => a.packageName !== ev.packageName) }
                : i);
    });

    return {
        items,
        isAreaFree,
        findFreeSpot,
        folderAt,
        addApp,
        addWidget,
        addFolder,
        renameFolder,
        addToFolder,
        removeFromFolder,
        moveItem,
        removeItem,
    };
});
