<script setup lang="ts">
import { computed } from 'vue';
import { useNow } from '@vueuse/core';
import type { StatusBarBackground } from '@/stores/useSettingsStore';
import { useDeviceStatus } from './useDeviceStatus';
import { useSimulatedSignal } from './useSimulatedSignal';
import NotificationIcons from './NotificationIcons.vue';
import LiveNotificationIcons from './LiveNotificationIcons.vue';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import { useMenuStore } from '@/stores/useMenuStore';

const props = defineProps<{
    background: StatusBarBackground;
    // side padding in CSS px, to keep clear of rounded screen corners
    sideMargin: number;
}>();

const now = useNow({ interval: 1000 });
const device = useDeviceStatus();
const notifications = useNotificationsStore();
const menu = useMenuStore();

// with our Bridge fork, our own panel (it also holds the quick settings); otherwise Android's shade
function openNotifications()
{
    if (notifications.isSupported)
        menu.isNotificationPanelOpen ? menu.closeAll() : menu.showNotificationPanel();
    else
        Bridge.requestExpandNotificationShade(true);
}

// Wi-Fi has 3 arcs, the cell signal 4 bars; neither strength is readable, so both drift believably
const wifi = useSimulatedSignal(3, device.online, device.effectiveType);
const cell = useSimulatedSignal(4, device.online, device.effectiveType);

// Gingerbread's status bar clock: 12-hour, with a smaller AM/PM ("11:02 AM")
const clock = computed(() =>
{
    const h = now.value.getHours();
    const m = now.value.getMinutes();
    return {
        time: `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')}`,
        ampm: h < 12 ? 'AM' : 'PM',
    };
});

// 2.3 drew green icons on its black bar; 2.2's light gray bar had dark ones
const isLight = computed(() => props.background === 'gray' || props.background === 'white');

// on mobile data there's no Wi-Fi icon, and the signal gets a "3G" tag and the activity arrows
const onWifi = computed(() => device.connectionType.value !== 'cellular');
const activity = computed(() => onWifi.value ? wifi : cell);

// without the Battery Status API, show a full battery
const batteryLevel = computed(() => device.batteryLevel.value ?? 1);
const batteryFillHeight = computed(() => Math.max(1, Math.round(batteryLevel.value * 14)));
const isBatteryLow = computed(() => device.batteryLevel.value !== null && batteryLevel.value <= 0.15 && !device.charging.value);

</script>

<template>
    <div
        class="gb-status-bar"
        :class="[background, { light: isLight, offline: !device.online.value }]"
        :style="{ '--side-margin': `${sideMargin}px` }"
        role="button"
        aria-label="Abrir notificaciones"
        @click="openNotifications">

        <!-- real icons when Bridge can read notifications, decorative ones otherwise -->
        <LiveNotificationIcons v-if="notifications.canRead" class="notifications" />
        <NotificationIcons v-else class="notifications" :charging="device.charging.value" />

        <div class="icons">
            <!-- data activity: down (in) and up (out) arrows, lit while "transferring" -->
            <svg class="icon activity" viewBox="0 0 8 18" aria-hidden="true">
                <path d="M4 17L0.8 12.5h6.4z" :class="{ on: activity.activityIn.value }" />
                <path d="M4 1L7.2 5.5H0.8z" :class="{ on: activity.activityOut.value }" />
            </svg>

            <!-- Wi-Fi: a wedge and two arcs, lit up to the current level (1..3) -->
            <svg v-if="onWifi" class="icon wifi" viewBox="0 0 20 18" aria-hidden="true">
                <path d="M10 16.5l2.4-2.9a3.8 3.8 0 0 0-4.8 0z" :class="{ on: wifi.level.value >= 1 }" />
                <path d="M5.8 11.4a6.6 6.6 0 0 1 8.4 0l1.7-2.1a9.4 9.4 0 0 0-11.8 0z" :class="{ on: wifi.level.value >= 2 }" />
                <path d="M2.3 7.2a12 12 0 0 1 15.4 0l1.7-2.1a14.8 14.8 0 0 0-18.8 0z" :class="{ on: wifi.level.value >= 3 }" />
            </svg>

            <span v-else class="network-tag">3G</span>

            <!-- signal: four rising bars, lit up to the current level -->
            <svg class="icon signal" viewBox="0 0 18 18" aria-hidden="true">
                <rect x="1" y="12" width="3" height="5" :class="{ on: cell.level.value >= 1 }" />
                <rect x="5.5" y="9" width="3" height="8" :class="{ on: cell.level.value >= 2 }" />
                <rect x="10" y="5.5" width="3" height="11.5" :class="{ on: cell.level.value >= 3 }" />
                <rect x="14.5" y="1.5" width="3" height="15.5" :class="{ on: cell.level.value >= 4 }" />
            </svg>

            <!-- battery: level fills from the bottom, bolt while charging -->
            <svg class="icon battery" :class="{ low: isBatteryLow }" viewBox="0 0 10 18" aria-hidden="true">
                <rect x="3" y="0.5" width="4" height="2" class="cap" />
                <rect x="0.75" y="2.25" width="8.5" height="15" rx="1" class="shell" />
                <rect
                    x="2"
                    :y="16.5 - batteryFillHeight"
                    width="6"
                    :height="batteryFillHeight"
                    class="fill" />
                <path v-if="device.charging.value" d="M5.8 5L2.8 10.4h2l-.6 3.6 3-5.4h-2z" class="bolt" />
            </svg>
        </div>

        <span class="clock">{{ clock.time }}<small>{{ clock.ampm }}</small></span>
    </div>
</template>

<style scoped lang="scss">
$gb-green: #7ed31b;
$gb-dim-dark: rgba(#fff, 0.22);
$gb-dim-light: rgba(#000, 0.2);

.gb-status-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;

    // notifications on the left, status icons and clock on the right
    > .notifications {
        margin-right: auto;
    }
    gap: 5px;
    // the center stays clear for the camera cutout; the side padding (a setting) keeps
    // the notification icons and the clock clear of rounded screen corners
    padding: 0 max(var(--side-margin), env(safe-area-inset-right)) 0 max(var(--side-margin), env(safe-area-inset-left));
    color: #fff;
    cursor: pointer;

    // same backgrounds as the strip behind the system bar (App.vue .status-bar-bg)
    &.gray {
        background: linear-gradient(to bottom, #f2f2f2, #c4c4c4);
        border-bottom: 1px solid #8a8a8a;
    }

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

    > .icons {
        display: flex;
        align-items: center;
        gap: 3px;

        > .icon {
            height: 16px;
            width: auto;

            // unlit parts stay visible but dim, like Gingerbread's empty bars
            > path,
            > rect {
                fill: $gb-dim-dark;
                transition: fill 0.3s;

                &.on {
                    fill: $gb-green;
                }
            }

            &.activity {
                width: 6px;

                > path.on {
                    fill: #fff;
                }
            }

            &.wifi {
                width: 18px;
            }

            &.signal {
                width: 16px;
            }

            &.battery {
                width: 9px;
                margin-left: 2px;

                > .cap {
                    fill: #d8d8d8;
                }

                > .shell {
                    fill: none;
                    stroke: #d8d8d8;
                    stroke-width: 1.2;
                }

                > .fill {
                    fill: $gb-green;
                }

                > .bolt {
                    fill: #fff;
                    stroke: #333;
                    stroke-width: 0.4;
                }

                &.low > .fill {
                    fill: #e53935;
                }
            }
        }

        > .network-tag {
            font-family: "Droid Sans", sans-serif;
            font-weight: bold;
            font-size: 9px;
            line-height: 1;
            color: $gb-green;
            align-self: flex-end;
            margin-bottom: 3px;
        }
    }

    // the clock in Droid Sans Bold, with a smaller AM/PM
    > .clock {
        margin-left: 4px;
        font-family: "Droid Sans", sans-serif;
        font-weight: bold;
        font-size: 15px;
        letter-spacing: -0.2px;
        white-space: nowrap;
        -webkit-font-smoothing: antialiased;

        > small {
            margin-left: 2px;
            font-size: 11px;
        }
    }

    // light bars (2.2 style): dark icons and text
    &.light {
        color: #222;

        > .notifications {
            color: #3a3a3a;

            :deep(rect.solid + .stroke) {
                stroke: #e8e8e8;
            }
        }

        > .icons > .icon {
            > path,
            > rect {
                fill: $gb-dim-light;

                &.on {
                    fill: #3a3a3a;
                }
            }

            &.activity > path.on {
                fill: #111;
            }

            &.battery {
                > .cap {
                    fill: #555;
                }

                > .shell {
                    stroke: #555;
                }

                > .fill {
                    fill: $gb-green;
                }
            }
        }

        > .icons > .network-tag {
            color: #3a3a3a;
        }
    }

    &.offline > .icons > .icon:not(.battery) > .on {
        fill: $gb-dim-dark;
    }

    &.light.offline > .icons > .icon:not(.battery) > .on {
        fill: $gb-dim-light;
    }
}
</style>
