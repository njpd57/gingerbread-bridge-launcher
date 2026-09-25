<script setup lang="ts">
import { ref } from 'vue';
import { useWindowInsetsStore } from '@/stores/useWindowInsetsStore';
import { useMenuStore } from '@/stores/useMenuStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDragStore } from '@/stores/useDragStore';
import { useLongPress } from '@/composables/useLongPress';
import { px } from './utils/el-utils';
import Workspace from './home/Workspace.vue';
import HomeGrid from './home/HomeGrid.vue';
import Dock from './home/Dock.vue';
import DragLayer from './home/DragLayer.vue';
import AppDrawer from './drawer/AppDrawer.vue';
import NexusWallpaper from './wallpaper/NexusWallpaper.vue';
import OptionsMenu from './menu/OptionsMenu.vue';
import WallpaperDialog from './menu/WallpaperDialog.vue';
import AddDialog from './menu/AddDialog.vue';
import FolderPanel from './home/FolderPanel.vue';

const DOCK_HEIGHT = 56;

const insets = useWindowInsetsStore();
const menu = useMenuStore();
const settings = useSettingsStore();
const drag = useDragStore();

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
    <div class="launcher-root" :class="{ 'system-wallpaper': settings.wallpaper === 'system' }">

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
                'padding-top': px(insets.statusBars.top),
            }">
            <template #default="{ page }">
                <HomeGrid
                    :page="page"
                    :style="{
                        'padding-bottom': px(DOCK_HEIGHT + insets.navigationBars.bottom),
                    }" />
            </template>
        </Workspace>

        <Dock
            class="dock"
            :style="{
                'bottom': px(insets.navigationBars.bottom),
            }" />

        <AppDrawer />

        <FolderPanel />

        <DragLayer />

        <OptionsMenu />
        <AddDialog />
        <WallpaperDialog />

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
}
</style>
