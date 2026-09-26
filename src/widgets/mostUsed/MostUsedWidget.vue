<script setup lang="ts">
import { computed } from 'vue';
import { useAppsStore } from '@/stores/useAppsStore';
import { useAppLauncherStore } from '@/stores/useAppLauncherStore';
import { GRID_COLS } from '@/stores/useHomeLayoutStore';
import { mostUsedApps } from '@/utils/mostUsed';
import Shortcut from '@/home/Shortcut.vue';

// The 4 apps opened most often, one per column, so they line up with the icons on the home screen.
// The counts come from useAppLauncherStore, which every launch goes through.

const apps = useAppsStore();
const launcher = useAppLauncherStore();

const shown = computed(() => mostUsedApps(
    launcher.launchCounts,
    launcher.recent,
    p => apps.apps.has(p),
    GRID_COLS)
    .map(p => apps.apps.get(p)!));
</script>

<template>
    <div class="most-used">
        <button
            v-for="app in shown"
            :key="app.packageName"
            class="app"
            :aria-label="app.label"
            @click="launcher.launch(app.packageName)">
            <Shortcut :package-name="app.packageName" :label="app.label" />
        </button>

        <div v-if="shown.length === 0" class="empty">
            Aquí aparecerán las aplicaciones que más abres
        </div>
    </div>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;

// no frame: just icons, in the same columns as the grid (the widget spans all 4)
.most-used {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    height: 100%;

    > .app {
        appearance: none;
        min-width: 0;
        padding: 0;
        border: none;
        background: none;
        color: inherit;
        font: inherit;
        cursor: pointer;

        // same orange glow as a pressed home screen icon
        &:active :deep(img) {
            filter: drop-shadow(0 0 4px $gingerbread-orange) drop-shadow(0 0 2px $gingerbread-orange);
        }
    }

    > .empty {
        grid-column: 1 / -1;
        align-self: center;
        padding: 8px 12px;
        border-radius: 6px;
        background-color: rgba(#000, 0.45);
        text-align: center;
        font-size: 13px;
        color: rgba(#fff, 0.85);
    }
}
</style>
