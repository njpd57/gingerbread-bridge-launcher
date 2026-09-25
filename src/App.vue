<script setup lang="ts">
import { ref } from 'vue';
import { useWindowInsetsStore } from '@/stores/useWindowInsetsStore';
import { px } from './utils/el-utils';
import Workspace from './home/Workspace.vue';
import Dock from './home/Dock.vue';
import AppDrawer from './drawer/AppDrawer.vue';
import AnalogClock from './widgets/clock/AnalogClock.vue';
import WeatherWidget from './widgets/weather/WeatherWidget.vue';
import { DEFAULT_PAGE } from './stores/useWorkspaceStore';
import NexusWallpaper from './wallpaper/NexusWallpaper.vue';

const insets = useWindowInsetsStore();

const wallpaper = ref<InstanceType<typeof NexusWallpaper>>();

// taps on empty workspace space (not on widgets) send pulses across the wallpaper
function onWorkspaceClick(e: MouseEvent)
{
    if ((e.target as HTMLElement).classList.contains('page'))
        wallpaper.value?.burst(e.clientX, e.clientY);
}

</script>

<template>
    <div class="launcher-root">

        <NexusWallpaper ref="wallpaper" />

        <Workspace
            class="workspace"
            @click="onWorkspaceClick"
            :style="{
                'padding-top': px(insets.statusBars.top),
            }">
            <template #default="{ page }">
                <div v-if="page === DEFAULT_PAGE" class="widgets">
                    <AnalogClock class="clock" />
                    <WeatherWidget />
                </div>
            </template>
        </Workspace>

        <Dock
            class="dock"
            :style="{
                'bottom': px(insets.navigationBars.bottom),
            }" />

        <AppDrawer />

    </div>
</template>

<style scoped lang="scss">
.launcher-root {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #000;

    > .workspace {
        position: relative;
    }

    .widgets {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        padding: 24px 12px 0;

        > .clock {
            width: min(55vw, 220px);
        }

        > :not(.clock) {
            align-self: stretch;
        }
    }

    > .dock {
        position: absolute;
        left: 0;
        right: 0;
    }
}
</style>
