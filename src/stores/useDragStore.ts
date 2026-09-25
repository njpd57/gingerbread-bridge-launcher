import { defineStore } from "pinia";
import { computed, ref, shallowRef, watch } from "vue";
import { GRID_COLS, GRID_ROWS, useHomeLayoutStore, type WidgetKind } from "./useHomeLayoutStore";
import { useWorkspaceStore } from "./useWorkspaceStore";

const EDGE_PX = 28;
const EDGE_DELAY_MS = 650;
const CLICK_GUARD_MS = 400;

export type DragPayload =
    | { source: 'drawer'; packageName: string; label: string }
    | { source: 'home'; itemId: string };

export type DragGhost =
    | { type: 'app'; packageName: string; label: string }
    | { type: 'widget'; widget: WidgetKind };

export type DropTarget =
    | { kind: 'cell'; page: number; x: number; y: number; valid: boolean }
    | { kind: 'trash' };

interface ActiveDrag
{
    payload: DragPayload;
    ghost: DragGhost;
    w: number;
    h: number;
    ghostWidth: number;
    ghostHeight: number;
    // where inside the ghost the finger is
    offsetX: number;
    offsetY: number;
}

export const useDragStore = defineStore('drag', () =>
{
    const layout = useHomeLayoutStore();
    const workspace = useWorkspaceStore();

    const active = ref<ActiveDrag | null>(null);
    const pointer = ref({ x: 0, y: 0 });
    const target = ref<DropTarget | null>(null);

    const draggedItemId = computed(() =>
        active.value?.payload.source === 'home' ? active.value.payload.itemId : null);

    // registered by HomeGrid (one per page) and Dock
    const gridEls = new Map<number, HTMLElement>();
    const trashEl = shallowRef<HTMLElement | null>(null);

    function registerGrid(page: number, el: HTMLElement | null)
    {
        if (el) gridEls.set(page, el);
        else gridEls.delete(page);
    }

    let edgeTimer = 0;
    let lastDropTime = 0;

    function currentGridRect()
    {
        return gridEls.get(workspace.currentPage)?.getBoundingClientRect() ?? null;
    }

    function isInside(rect: DOMRect, x: number, y: number)
    {
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    function updateTarget()
    {
        const a = active.value;
        if (!a) return;
        const { x, y } = pointer.value;

        const trashRect = trashEl.value?.getBoundingClientRect();
        if (trashRect && isInside(trashRect, x, y))
        {
            target.value = { kind: 'trash' };
            return;
        }

        const rect = currentGridRect();
        if (!rect)
        {
            target.value = null;
            return;
        }

        const cellW = rect.width / GRID_COLS;
        const cellH = rect.height / GRID_ROWS;
        const left = x - a.offsetX;
        const top = y - a.offsetY;
        const col = Math.max(0, Math.min(GRID_COLS - a.w, Math.round((left - rect.left) / cellW)));
        const row = Math.max(0, Math.min(GRID_ROWS - a.h, Math.round((top - rect.top) / cellH)));
        const page = workspace.currentPage;

        target.value = {
            kind: 'cell',
            page,
            x: col,
            y: row,
            valid: layout.isAreaFree({ page, x: col, y: row, w: a.w, h: a.h }, draggedItemId.value ?? undefined),
        };
    }

    function clearEdgeTimer()
    {
        clearTimeout(edgeTimer);
        edgeTimer = 0;
    }

    // holding an item near the left/right edge flips to the neighbouring page
    function updateEdgePaging()
    {
        const { x } = pointer.value;
        const direction = x < EDGE_PX ? -1 : x > window.innerWidth - EDGE_PX ? 1 : 0;

        if (direction === 0)
        {
            clearEdgeTimer();
            return;
        }

        if (!edgeTimer)
        {
            edgeTimer = window.setTimeout(() =>
            {
                edgeTimer = 0;
                workspace.goToPage(workspace.currentPage + direction);
            }, EDGE_DELAY_MS);
        }
    }

    function onPointerMove(e: PointerEvent)
    {
        pointer.value = { x: e.clientX, y: e.clientY };
        updateTarget();
        updateEdgePaging();
    }

    // stop the page (or the drawer) from scrolling under the finger while dragging
    function preventTouchScroll(e: TouchEvent)
    {
        e.preventDefault();
    }

    function attachListeners()
    {
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', drop);
        window.addEventListener('pointercancel', cancel);
        window.addEventListener('touchmove', preventTouchScroll, { passive: false });
    }

    function detachListeners()
    {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', drop);
        window.removeEventListener('pointercancel', cancel);
        window.removeEventListener('touchmove', preventTouchScroll);
    }

    /**
     * Starts dragging. `sourceRect` is the dragged element's on-screen box, so the item stays
     * under the finger where it was grabbed; without it the item is centered on the finger.
     */
    function start(payload: DragPayload, x: number, y: number, sourceRect?: DOMRect)
    {
        let ghost: DragGhost;
        let w = 1;
        let h = 1;

        if (payload.source === 'drawer')
        {
            ghost = { type: 'app', packageName: payload.packageName, label: payload.label };
        }
        else
        {
            const item = layout.items.find(i => i.id === payload.itemId);
            if (!item) return;
            ghost = item.type === 'app'
                ? { type: 'app', packageName: item.packageName, label: item.label }
                : { type: 'widget', widget: item.widget };
            w = item.w;
            h = item.h;
        }

        const rect = currentGridRect();
        const cellW = rect ? rect.width / GRID_COLS : 80;
        const cellH = rect ? rect.height / GRID_ROWS : 100;
        const ghostWidth = w * cellW;
        const ghostHeight = h * cellH;

        active.value = {
            payload,
            ghost,
            w,
            h,
            ghostWidth,
            ghostHeight,
            offsetX: sourceRect ? Math.min(ghostWidth, Math.max(0, x - sourceRect.left)) : ghostWidth / 2,
            offsetY: sourceRect ? Math.min(ghostHeight, Math.max(0, y - sourceRect.top)) : ghostHeight / 2,
        };
        pointer.value = { x, y };
        updateTarget();
        attachListeners();
    }

    function finish()
    {
        detachListeners();
        clearEdgeTimer();
        active.value = null;
        target.value = null;
        lastDropTime = Date.now();
    }

    function drop()
    {
        const a = active.value;
        const t = target.value;

        if (a && t)
        {
            if (t.kind === 'trash')
            {
                if (a.payload.source === 'home')
                    layout.removeItem(a.payload.itemId);
            }
            else if (t.valid)
            {
                if (a.payload.source === 'drawer')
                    layout.addApp(a.payload.packageName, a.payload.label, t.page, t.x, t.y);
                else
                    layout.moveItem(a.payload.itemId, t.page, t.x, t.y);
            }
        }

        finish();
    }

    function cancel()
    {
        finish();
    }

    /** True right after a drop, so the click that follows the release can be ignored. */
    function justDropped()
    {
        return Date.now() - lastDropTime < CLICK_GUARD_MS;
    }

    // the grid moves under the finger while flipping pages
    watch(() => workspace.currentPage, updateTarget);

    return {
        active,
        pointer,
        target,
        draggedItemId,
        trashEl,
        registerGrid,
        start,
        cancel,
        justDropped,
    };
});
