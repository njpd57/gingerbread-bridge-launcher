<script setup lang="ts">
import { computed } from 'vue';
import { useAppsStore } from '@/stores/useAppsStore';
import { PAGE_COUNT, useWorkspaceStore } from '@/stores/useWorkspaceStore';
import PhoneIcon from './icons/PhoneIcon.vue';
import AllAppsIcon from './icons/AllAppsIcon.vue';
import BrowserIcon from './icons/BrowserIcon.vue';

// Bridge can't tell us the default dialer/browser, so launch the first installed candidate
const PHONE_PACKAGES = [
    'com.google.android.dialer',
    'com.android.dialer',
    'com.samsung.android.dialer',
    'com.android.contacts',
];

const BROWSER_PACKAGES = [
    'com.android.chrome',
    'org.mozilla.firefox',
    'org.mozilla.fenix',
    'com.brave.browser',
    'com.sec.android.app.sbrowser',
    'com.microsoft.emmx',
    'com.opera.browser',
    'com.duckduckgo.mobile.android',
];

const apps = useAppsStore();
const workspace = useWorkspaceStore();

const dotsLeft = computed(() => workspace.currentPage);
const dotsRight = computed(() => PAGE_COUNT - 1 - workspace.currentPage);

function launchFirstInstalled(candidates: string[], notFoundMessage: string)
{
    const packageName = candidates.find(p => apps.apps.has(p));
    if (packageName)
        Bridge.requestLaunchApp(packageName, true);
    else
        Bridge.showToast(notFoundMessage);
}

function openAllApps()
{
    // temporary: Bridge's own drawer, until our Gingerbread drawer exists
    Bridge.requestOpenBridgeAppDrawer(true);
}

</script>

<template>
    <nav class="dock">
        <button
            class="dots left"
            :disabled="dotsLeft === 0"
            aria-label="Página anterior"
            @click="workspace.goToPage(workspace.currentPage - 1)">
            <span v-for="i in dotsLeft" :key="i" class="dot"></span>
        </button>

        <div class="hotseat">
            <button
                class="hotseat-button"
                aria-label="Teléfono"
                @click="launchFirstInstalled(PHONE_PACKAGES, 'No se encontró una app de teléfono')">
                <PhoneIcon />
            </button>
            <button
                class="hotseat-button"
                aria-label="Aplicaciones"
                @click="openAllApps">
                <AllAppsIcon />
            </button>
            <button
                class="hotseat-button"
                aria-label="Navegador"
                @click="launchFirstInstalled(BROWSER_PACKAGES, 'No se encontró un navegador')">
                <BrowserIcon />
            </button>
        </div>

        <button
            class="dots right"
            :disabled="dotsRight === 0"
            aria-label="Página siguiente"
            @click="workspace.goToPage(workspace.currentPage + 1)">
            <span v-for="i in dotsRight" :key="i" class="dot"></span>
        </button>
    </nav>
</template>

<style scoped lang="scss">
$hotseat-height: 56px;
$icon-size: 44px;
$gingerbread-orange: #ffa800;

button {
    appearance: none;
    border: none;
    background: none;
    padding: 0;
    color: inherit;
    cursor: pointer;
}

.dock {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    height: $hotseat-height;

    > .dots {
        display: flex;
        align-items: center;
        gap: 5px;
        width: 64px;
        height: $hotseat-height;
        padding: 0 14px;

        &.left {
            justify-content: flex-start;
        }

        &.right {
            justify-content: flex-end;
        }

        &:disabled {
            cursor: default;
        }

        > .dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background-color: rgba(#fff, 0.8);
            box-shadow: 0 0 3px rgba(#fff, 0.6);
        }

        &:active:not(:disabled) > .dot {
            background-color: $gingerbread-orange;
            box-shadow: 0 0 5px $gingerbread-orange;
        }
    }

    > .hotseat {
        display: flex;
        align-items: center;
        justify-content: space-around;
        flex: 0 1 220px;
        height: $hotseat-height;
        border-radius: 6px 6px 0 0;
        border-top: 1px solid rgba(#fff, 0.18);
        background: linear-gradient(to bottom, rgba(#3a3a3a, 0.85), rgba(#111, 0.9));

        > .hotseat-button {
            display: grid;
            place-items: center;
            width: $icon-size + 16px;
            height: $hotseat-height;

            > svg {
                width: $icon-size;
                height: $icon-size;
                transition: filter 0.1s;
            }

            &:active > svg {
                filter: drop-shadow(0 0 4px $gingerbread-orange) drop-shadow(0 0 2px $gingerbread-orange);
            }
        }
    }
}
</style>
