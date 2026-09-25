<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAppsStore, type InstalledAppInfo } from '@/stores/useAppsStore';
import { useHomeLayoutStore, WIDGET_SIZES, type WidgetKind } from '@/stores/useHomeLayoutStore';
import { useMenuStore } from '@/stores/useMenuStore';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import GbDialog from '@/components/GbDialog.vue';
import FolderIcon from '@/home/icons/FolderIcon.vue';

type View = 'root' | 'apps' | 'widgets';

const apps = useAppsStore();
const layout = useHomeLayoutStore();
const menu = useMenuStore();
const workspace = useWorkspaceStore();

const view = ref<View>('root');

// every time the dialog opens, start from the top-level list
watch(() => menu.openDialog, d =>
{
    if (d === 'add') view.value = 'root';
});

const title = computed(() =>
{
    switch (view.value)
    {
        case 'apps': return 'Seleccionar aplicación';
        case 'widgets': return 'Seleccionar widget';
        default: return 'Añadir a la pantalla de inicio';
    }
});

const sortedApps = computed(() =>
    Array.from(apps.apps.values()).sort((a, b) => a.label.localeCompare(b.label)));

const widgets: { kind: WidgetKind; label: string }[] = [
    { kind: 'clock', label: 'Reloj analógico' },
    { kind: 'clockLarge', label: 'Reloj analógico grande' },
    { kind: 'weather', label: 'Tiempo' },
];

/** Where a new item of this size goes: the long-pressed cell if it fits, otherwise the first free spot on that page. */
function findSpot(w: number, h: number)
{
    const anchor = menu.addAnchor;
    const page = anchor?.page ?? workspace.currentPage;
    const spot = layout.findFreeSpot(page, w, h, anchor ?? undefined);
    if (!spot)
        Bridge.showToast('No hay más espacio en esta pantalla de inicio');
    return spot;
}

function addApp(app: InstalledAppInfo)
{
    const spot = findSpot(1, 1);
    if (spot) layout.addApp(app.packageName, app.label, spot.page, spot.x, spot.y);
    menu.closeAll();
}

function addWidget(kind: WidgetKind)
{
    const { w, h } = WIDGET_SIZES[kind];
    const spot = findSpot(w, h);
    if (spot) layout.addWidget(kind, spot.page, spot.x, spot.y);
    menu.closeAll();
}

function addFolder()
{
    const spot = findSpot(1, 1);
    if (spot) layout.addFolder(spot.page, spot.x, spot.y);
    menu.closeAll();
}

</script>

<template>
    <GbDialog
        :open="menu.openDialog === 'add'"
        :title="title"
        @close="menu.closeAll()">

        <template v-if="view === 'root'">
            <button class="row" @click="view = 'apps'">
                <svg class="row-icon" viewBox="0 0 32 32" aria-hidden="true">
                    <rect x="4" y="4" width="24" height="24" rx="4" fill="#5a8f1c" />
                    <path d="M12 20l8-8M14 12h6v6" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>Accesos directos</span>
            </button>
            <button class="row" @click="view = 'widgets'">
                <svg class="row-icon" viewBox="0 0 32 32" aria-hidden="true">
                    <rect x="4" y="4" width="11" height="11" rx="2" fill="#4a8ad4" />
                    <rect x="17" y="4" width="11" height="11" rx="2" fill="#d44a4a" />
                    <rect x="4" y="17" width="24" height="11" rx="2" fill="#e0b52c" />
                </svg>
                <span>Widgets</span>
            </button>
            <button class="row" @click="addFolder">
                <FolderIcon class="row-icon" />
                <span>Carpetas</span>
            </button>
            <button class="row" @click="menu.showDialog('wallpaper')">
                <svg class="row-icon" viewBox="0 0 32 32" aria-hidden="true">
                    <rect x="3" y="6" width="26" height="20" rx="2" fill="#2d3a55" stroke="#aab" stroke-width="1.5" />
                    <path d="M6 23l6-8 5 6 3-3 6 5z" fill="#8fd400" />
                    <circle cx="22" cy="12" r="2.5" fill="#ffd21f" />
                </svg>
                <span>Fondos de pantalla</span>
            </button>
        </template>

        <template v-else-if="view === 'apps'">
            <button
                v-for="app in sortedApps"
                :key="app.packageName"
                class="row"
                @click="addApp(app)">
                <img
                    class="row-icon"
                    :src="Bridge.getDefaultAppIconURL(app.packageName)"
                    loading="lazy"
                    alt="" />
                <span>{{ app.label }}</span>
            </button>
            <div v-if="sortedApps.length === 0" class="empty">Cargando aplicaciones…</div>
        </template>

        <template v-else>
            <button
                v-for="w in widgets"
                :key="w.kind"
                class="row"
                @click="addWidget(w.kind)">
                <span class="text">
                    <span>{{ w.label }}</span>
                    <span class="hint">{{ WIDGET_SIZES[w.kind].w }} × {{ WIDGET_SIZES[w.kind].h }}</span>
                </span>
            </button>
        </template>

    </GbDialog>
</template>

<style scoped lang="scss">
.row {
    appearance: none;
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 60px;
    padding: 8px 16px;
    border: none;
    border-bottom: 1px solid rgba(#fff, 0.1);
    background: none;
    color: #fff;
    font: inherit;
    font-size: 17px;
    text-align: left;
    cursor: pointer;

    &:active {
        background: linear-gradient(to bottom, #ffc64d, #ff8a00);
        color: #111;
    }

    > .row-icon {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
    }

    > .text {
        display: flex;
        flex-direction: column;
        gap: 2px;

        > .hint {
            font-size: 13px;
            opacity: 0.65;
        }
    }
}

.empty {
    padding: 24px 16px;
    text-align: center;
    color: rgba(#fff, 0.7);
}
</style>
