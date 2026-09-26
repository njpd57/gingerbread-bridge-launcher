<script setup lang="ts">
import { computed } from 'vue';
import { useTogglesStore } from '@/stores/useTogglesStore';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import { useMenuStore } from '@/stores/useMenuStore';

// A take on Android 2.x's "Power control" widget: a row of buttons, each with an indicator bar
// underneath (green = on, amber = in between, gray = off). Bridge can't toggle Wi-Fi, Bluetooth,
// GPS or brightness, so these are the actions it can do.

type Indicator = 'on' | 'mid' | 'off' | 'none';

const toggles = useTogglesStore();
const notifications = useNotificationsStore();
const menu = useMenuStore();

// our own notification panel with the Bridge fork, Android's shade otherwise
function openNotifications()
{
    if (notifications.isSupported)
        menu.showNotificationPanel();
    else
        Bridge.requestExpandNotificationShade(true);
}

const lockIndicator = computed<Indicator>(() => toggles.canLockScreen ? 'on' : 'off');

const nightIndicator = computed<Indicator>(() =>
{
    if (!toggles.canRequestSystemNightMode) return 'off';
    switch (toggles.systemNightMode)
    {
        case 'yes': return 'on';
        case 'auto':
        case 'custom': return 'mid';
        default: return 'off';
    }
});

function lockScreen()
{
    if (!toggles.supportsLockScreen)
    {
        Bridge.showToast('Tu versión de Bridge no permite bloquear la pantalla.');
        return;
    }
    if (!toggles.canLockScreen)
    {
        Bridge.showToast('Para bloquear, activa el servicio de accesibilidad de Bridge y permite bloquear la pantalla en sus ajustes.', true);
        Bridge.requestOpenBridgeSettings(true);
        return;
    }
    Bridge.requestLockScreen(true);
}

function toggleNightMode()
{
    if (!toggles.supportsNightMode)
    {
        Bridge.showToast('Tu versión de Bridge no permite cambiar el modo noche.');
        return;
    }
    if (!toggles.canRequestSystemNightMode)
    {
        Bridge.showToast('Bridge necesita el permiso WRITE_SECURE_SETTINGS para cambiar el modo noche (se concede una vez por adb).', true);
        return;
    }
    toggles.systemNightMode = toggles.systemNightMode === 'yes' ? 'no' : 'yes';
}

</script>

<template>
    <div class="power-control">
        <button class="toggle" :class="{ unavailable: !toggles.canLockScreen }" aria-label="Bloquear pantalla" @click="lockScreen">
            <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M10 14v-4a6 6 0 0 1 12 0v4" fill="none" stroke="currentColor" stroke-width="3" />
                <rect x="7" y="14" width="18" height="14" rx="2" fill="currentColor" />
                <circle cx="16" cy="20" r="2" fill="#1a1a1a" />
                <rect x="15" y="21" width="2" height="4" fill="#1a1a1a" />
            </svg>
            <span class="indicator" :class="lockIndicator"></span>
        </button>

        <button class="toggle" :class="{ unavailable: !toggles.canRequestSystemNightMode }" aria-label="Modo noche" @click="toggleNightMode">
            <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M20 4a12 12 0 1 0 8 19 10 10 0 0 1-8-19z" fill="currentColor" />
            </svg>
            <span class="indicator" :class="nightIndicator"></span>
        </button>

        <button class="toggle" aria-label="Notificaciones" @click="openNotifications">
            <svg viewBox="0 0 32 32" aria-hidden="true">
                <rect x="5" y="4" width="22" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2.5" />
                <path d="M9 9h14M9 13h10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
                <path d="M11 22l5 5 5-5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="indicator none"></span>
        </button>

        <button class="toggle" aria-label="Ajustes" @click="Bridge.requestOpenAndroidSettings(true)">
            <svg viewBox="0 0 32 32" aria-hidden="true">
                <g fill="currentColor">
                    <rect
                        v-for="a in 8"
                        :key="a"
                        x="14" y="3" width="4" height="7" rx="1"
                        :transform="`rotate(${a * 45} 16 16)`" />
                </g>
                <circle cx="16" cy="16" r="8.5" fill="currentColor" />
                <circle cx="16" cy="16" r="3.5" fill="#1a1a1a" />
            </svg>
            <span class="indicator none"></span>
        </button>
    </div>
</template>

<style scoped lang="scss">
$gb-green: #7ed31b;
$gb-amber: #ffb300;
$gingerbread-orange: #ffa800;

// dark glossy panel split into equal cells by thin dividers
.power-control {
    display: flex;
    width: 100%;
    height: 72px;
    overflow: hidden;
    border: 1px solid rgba(#fff, 0.16);
    border-radius: 6px;
    background:
        linear-gradient(to bottom, rgba(#fff, 0.1), rgba(#fff, 0.03) 50%, transparent 50%),
        linear-gradient(to bottom, rgba(#3a3a3a, 0.8), rgba(#101010, 0.9));
    box-shadow: 0 3px 8px rgba(#000, 0.5);

    > .toggle {
        appearance: none;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0;
        border: none;
        border-right: 1px solid rgba(#000, 0.6);
        box-shadow: inset -1px 0 0 rgba(#fff, 0.08);
        background: none;
        color: #e6e6e6;
        cursor: pointer;

        &:last-child {
            border-right: none;
            box-shadow: none;
        }

        &.unavailable > svg {
            opacity: 0.45;
        }

        > svg {
            width: 28px;
            height: 28px;
        }

        &:active {
            background: linear-gradient(to bottom, rgba($gingerbread-orange, 0.85), rgba(#ff8a00, 0.85));
            color: #111;
        }

        // the status bar under each button
        > .indicator {
            width: 60%;
            height: 4px;
            border-radius: 2px;
            background-color: #4a4a4a;

            &.on {
                background-color: $gb-green;
                box-shadow: 0 0 4px rgba($gb-green, 0.7);
            }

            &.mid {
                background-color: $gb-amber;
                box-shadow: 0 0 4px rgba($gb-amber, 0.7);
            }

            &.none {
                visibility: hidden;
            }
        }
    }
}
</style>
