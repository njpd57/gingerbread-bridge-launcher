<script setup lang="ts">
import { useWindowInsetsStore } from '@/stores/useWindowInsetsStore';
import { px } from './utils/el-utils';
import Workspace from './home/Workspace.vue';
import Dock from './home/Dock.vue';

const insets = useWindowInsetsStore();

</script>

<template>
    <div class="launcher-root">

        <Workspace
            class="workspace"
            :style="{
                'padding-top': px(insets.statusBars.top),
            }" />

        <Dock
            class="dock"
            :style="{
                'bottom': px(insets.navigationBars.bottom),
            }" />

    </div>
</template>

<style scoped lang="scss">
.launcher-root {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    // placeholder until the Nexus live wallpaper (step 5)
    background: radial-gradient(ellipse at 50% 80%, #2a3140 0%, #0b0d12 60%, #000 100%);

    > .dock {
        position: absolute;
        left: 0;
        right: 0;
    }
}
</style>
