<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useWindowSize } from '@vueuse/core';
import { useWindowInsetsStore } from '@/stores/useWindowInsetsStore';
import { useMenuStore } from '@/stores/useMenuStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDragStore } from '@/stores/useDragStore';
import { autoGridRows, GRID_COLS, useHomeLayoutStore } from '@/stores/useHomeLayoutStore';
import { useLongPress } from '@/composables/useLongPress';
import { fittedIconSize, scaledIconSize } from '@/utils/iconSize';
import Workspace from './home/Workspace.vue';
import HomeGrid from './home/HomeGrid.vue';
import Dock from './home/Dock.vue';
import DragLayer from './home/DragLayer.vue';
import AppDrawer from './drawer/AppDrawer.vue';
import NexusWallpaper from './wallpaper/NexusWallpaper.vue';
import OptionsMenu from './menu/OptionsMenu.vue';
import WallpaperDialog from './menu/WallpaperDialog.vue';
import AddDialog from './menu/AddDialog.vue';
import AppearanceDialog from './menu/AppearanceDialog.vue';
import ManageAppsDialog from './menu/ManageAppsDialog.vue';
import SearchPanel from './widgets/search/SearchPanel.vue';
import FolderPanel from './home/FolderPanel.vue';
import GingerbreadStatusBar from './statusbar/GingerbreadStatusBar.vue';
import NotificationPanel from './notifications/NotificationPanel.vue';

const DOCK_HEIGHT = 56;
const GRID_SIDE_PADDING = 8;

const insets = useWindowInsetsStore();
const menu = useMenuStore();
const settings = useSettingsStore();
const drag = useDragStore();
const layout = useHomeLayoutStore();

// fit as many Gingerbread-shaped rows as the screen allows (tall phones get more).
// Only measured in portrait: in landscape the rows stay as they were, because fewer rows would
// move items that no longer fit, and rotating back wouldn't put them back.
const windowSize = useWindowSize();
watchEffect(() =>
{
    if (windowSize.width.value > windowSize.height.value) return;
    // nor while typing: if the keyboard shrinks the WebView, fewer rows would move icons for good
    if (isTyping()) return;
    const gridHeight = windowSize.height.value - insets.statusBarHeight - DOCK_HEIGHT - insets.navigationBarHeight;
    layout.autoRows = autoGridRows(windowSize.width.value - GRID_SIDE_PADDING, gridHeight);
});

// the home screen icons follow the user's scale but must fit their cell (the drawer's needn't)
const homeIconSize = computed(() =>
{
    const gridHeight = windowSize.height.value - insets.statusBarHeight - DOCK_HEIGHT - insets.navigationBarHeight;
    const cellWidth = (windowSize.width.value - GRID_SIDE_PADDING) / GRID_COLS;
    return fittedIconSize(settings.iconScale, cellWidth, gridHeight / layout.rows);
});

function isTyping()
{
    const el = document.activeElement;
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
        || (el instanceof HTMLElement && el.isContentEditable);
}

const wallpaper = ref<InstanceType<typeof NexusWallpaper>>();

// empty space = anywhere on the workspace that isn't an icon or widget
function isEmptySpace(target: EventTarget | null)
{
    return target instanceof Element && !target.closest('.home-item');
}

// long-pressing empty space opens the options menu, remembering the cell for "Añadir"
const longPress = useLongPress<null>((_, pos) => menu.showOptionsMenu(drag.cellAt(pos.x, pos.y)));

function onPointerDown(e: PointerEvent)
{
    if (isEmptySpace(e.target))
        longPress.down(null, e);
}

// a tap on empty space sends pulses across the Nexus wallpaper
function onWorkspaceClick(e: MouseEvent)
{
    if (longPress.consumeLongPress() || drag.justDropped()) return;
    if (isEmptySpace(e.target))
        wallpaper.value?.burst(e.clientX, e.clientY);
}

</script>

<template>
    <div
        class="launcher-root"
        :class="{ 'system-wallpaper': settings.wallpaper === 'system' }"
        :style="{
            '--status-bar-height': insets.statusBarCss,
            '--nav-bar-height': insets.navigationBarCss,
            '--icon-size': `${homeIconSize}px`,
            '--drawer-icon-size': `${scaledIconSize(settings.iconScale)}px`,
        }">

        <NexusWallpaper v-if="settings.wallpaper === 'nexus'" ref="wallpaper" />

        <Workspace
            class="workspace"
            @pointerdown="onPointerDown"
            @pointermove="longPress.move"
            @pointerup="longPress.cancel"
            @pointercancel="longPress.cancel"
            @pointerleave="longPress.cancel"
            @contextmenu.prevent
            @click="onWorkspaceClick"
            :style="{
                'padding-top': 'var(--status-bar-height)',
            }">
            <template #default="{ page }">
                <HomeGrid
                    :page="page"
                    :style="{
                        'padding-bottom': `calc(${DOCK_HEIGHT}px + var(--nav-bar-height))`,
                    }" />
            </template>
        </Workspace>

        <Dock
            class="dock"
            :style="{
                'bottom': 'var(--nav-bar-height)',
            }" />

        <AppDrawer />

        <FolderPanel />

        <DragLayer />

        <OptionsMenu />
        <AddDialog />
        <WallpaperDialog />
        <AppearanceDialog />
        <ManageAppsDialog />

        <SearchPanel />

        <NotificationPanel />

        <!-- our own Gingerbread status bar, replacing the system one (hidden through Bridge) -->
        <GingerbreadStatusBar
            v-if="settings.gingerbreadStatusBar"
            class="gb-status-bar"
            :background="settings.statusBarBackground"
            :side-margin="settings.statusBarSideMargin"
            :style="{ 'height': 'var(--status-bar-height)' }" />

        <!-- otherwise, an optional Gingerbread-style background behind the (translucent) system status bar -->
        <div
            v-else-if="settings.statusBarBackground !== 'none'"
            class="status-bar-bg"
            :class="settings.statusBarBackground"
            :style="{ 'height': 'var(--status-bar-height)' }"></div>

    </div>
</template>

<style scoped lang="scss">
.launcher-root {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #000;

    // let Bridge's system wallpaper show through
    &.system-wallpaper {
        background-color: transparent;
    }

    > .workspace {
        position: relative;
    }

    > .dock {
        position: absolute;
        left: 0;
        right: 0;
    }

    > .gb-status-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
    }

    > .status-bar-bg {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        pointer-events: none;

        // Gingerbread's light gray status bar
        &.gray {
            background: linear-gradient(to bottom, #f2f2f2, #c4c4c4);
            border-bottom: 1px solid #8a8a8a;
        }

        // Gingerbread's black status bar: dark gray fading to black, with a faint line underneath
        &.blackGradient {
            background: linear-gradient(to bottom, #3c3c3c, #0c0c0c 70%, #000);
            border-bottom: 1px solid #2a2a2a;
        }

        &.white {
            background-color: #fff;
        }

        &.black {
            background-color: #000;
        }
    }
}
</style>
