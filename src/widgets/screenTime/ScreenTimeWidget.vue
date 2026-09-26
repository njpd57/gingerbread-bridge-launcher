<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useNow } from '@vueuse/core';
import { useUsageStore } from '@/stores/useUsageStore';
import { useAppsStore } from '@/stores/useAppsStore';
import { formatDuration, topAppsByTime, totalScreenTime } from '@/utils/usage';
import type { BridgeAppUsage } from '@/types/bridge-fork';

// Today's screen time (4x1): the total on the left, and the 3 apps used longest today with their time.
// Needs our Bridge fork and "Usage access" (tapping the widget without it opens that setting).

const TOP_APPS = 3;

const usageStore = useUsageStore();
const apps = useAppsStore();
const now = useNow({ interval: 60_000 });

const usage = ref<BridgeAppUsage[]>([]);
const today = computed(() => now.value.toDateString());

watch([today, () => usageStore.version, () => usageStore.canRead], async () =>
{
    const n = new Date();
    usage.value = await usageStore.fetchUsage(new Date(n.getFullYear(), n.getMonth(), n.getDate()), n);
}, { immediate: true });

const isInstalled = (p: string) => apps.apps.has(p);
const total = computed(() => totalScreenTime(usage.value, isInstalled));
const top = computed(() => topAppsByTime(usage.value, isInstalled, TOP_APPS));

const message = computed(() =>
{
    if (!usageStore.isSupported) return 'Tu versión de Bridge no puede leer el uso de las apps.';
    if (!usageStore.canRead) return 'Toca para permitir el acceso a los datos de uso.';
    return null;
});

function onClick()
{
    if (usageStore.isSupported && !usageStore.canRead)
        usageStore.requestAccess();
}
</script>

<template>
    <div class="screen-time-widget" @click="onClick">
        <div v-if="message" class="message">
            <svg viewBox="0 0 32 32" aria-hidden="true">
                <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="2.5" />
                <path d="M16 9v8l5 3" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
            </svg>
            <span>{{ message }}</span>
        </div>

        <template v-else>
            <div class="total">
                <span class="label">Hoy</span>
                <span class="value">{{ formatDuration(total) }}</span>
            </div>

            <div class="apps">
                <div v-for="u in top" :key="u.packageName" class="app">
                    <img :src="Bridge.getDefaultAppIconURL(u.packageName)" alt="" draggable="false" />
                    <span class="time">{{ formatDuration(u.totalTimeMs) }}</span>
                </div>
                <span v-if="top.length === 0" class="empty">Todavía no usaste apps hoy.</span>
            </div>
        </template>
    </div>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;

// the power control's glossy panel
.screen-time-widget {
    @include gb-widget-glossy;
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 72px;
    height: 100%;
    max-height: 104px;
    padding: 8px 12px;
    text-shadow: 0 1px 2px #000;

    > .message {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        color: rgba(#fff, 0.8);

        > svg {
            flex-shrink: 0;
            width: 28px;
            height: 28px;
        }
    }

    > .total {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        min-width: 96px;
        padding-right: 10px;
        border-right: 1px solid rgba(#fff, 0.15);

        > .label {
            font-size: 12px;
            color: $gingerbread-orange;
            text-transform: uppercase;
        }

        > .value {
            font-size: 20px;
            font-weight: bold;
            white-space: nowrap;
        }
    }

    > .apps {
        flex: 1;
        min-width: 0;
        display: flex;
        justify-content: space-around;
        align-items: center;

        > .app {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;

            > img {
                width: 36px;
                height: 36px;
            }

            > .time {
                font-size: 11px;
                color: rgba(#fff, 0.8);
                white-space: nowrap;
            }
        }

        > .empty {
            font-size: 13px;
            color: rgba(#fff, 0.7);
        }
    }
}
</style>
