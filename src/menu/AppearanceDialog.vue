<script setup lang="ts">
import { computed } from 'vue';
import { useMenuStore } from '@/stores/useMenuStore';
import { MAX_GRID_ROWS, MIN_GRID_ROWS, useHomeLayoutStore } from '@/stores/useHomeLayoutStore';
import { MAX_STATUS_BAR_HEIGHT, useSettingsStore, type StatusBarBackground } from '@/stores/useSettingsStore';
import { useWindowInsetsStore } from '@/stores/useWindowInsetsStore';
import GbDialog from '@/components/GbDialog.vue';
import GbButton from '@/components/GbButton.vue';
import GbRadioRow from '@/components/GbRadioRow.vue';

const menu = useMenuStore();
const layout = useHomeLayoutStore();
const settings = useSettingsStore();
const insets = useWindowInsetsStore();

const statusBarOptions: { value: StatusBarBackground; label: string }[] = [
    { value: 'none', label: 'Transparente' },
    { value: 'gray', label: 'Degradado gris' },
    { value: 'blackGradient', label: 'Degradado negro' },
    { value: 'white', label: 'Blanco' },
    { value: 'black', label: 'Negro' },
];

const isHeightAuto = computed(() => settings.statusBarHeight < 0);

function onHeightInput(e: Event)
{
    settings.statusBarHeight = Number((e.target as HTMLInputElement).value);
}

// 0 = automatic
const rowOptions = [0, ...Array.from({ length: MAX_GRID_ROWS - MIN_GRID_ROWS + 1 }, (_, i) => MIN_GRID_ROWS + i)];

</script>

<template>
    <GbDialog
        :open="menu.openDialog === 'appearance'"
        title="Apariencia"
        @close="menu.closeAll()">

        <div class="section-title">Barra de estado</div>

        <GbRadioRow
            v-for="opt in statusBarOptions"
            :key="opt.value"
            name="statusBarBackground"
            :value="opt.value"
            :model-value="settings.statusBarBackground"
            :label="opt.label"
            @update:model-value="settings.statusBarBackground = opt.value">
            <template #icon>
                <span class="swatch" :class="opt.value"></span>
            </template>
        </GbRadioRow>

        <section class="options">
            <div class="field-label">Altura de la barra</div>
            <div class="height-control">
                <button
                    class="auto"
                    :class="{ selected: isHeightAuto }"
                    @click="settings.statusBarHeight = -1">
                    Auto ({{ Math.round(insets.measuredStatusBarHeight) }} px)
                </button>
                <input
                    type="range"
                    min="0"
                    :max="MAX_STATUS_BAR_HEIGHT"
                    step="1"
                    :class="{ auto: isHeightAuto }"
                    :value="Math.round(insets.statusBarHeight)"
                    aria-label="Altura de la barra de estado"
                    @input="onHeightInput" />
                <span class="value">{{ Math.round(insets.statusBarHeight) }} px</span>
            </div>
            <div class="field-hint">
                Ajústala para que el fondo cubra justo la barra de Samsung. También mueve el contenido
                de las pantallas para que no quede debajo de la barra.
                El color de los iconos se cambia en los ajustes de Bridge.
            </div>
        </section>

        <div class="section-title">Pantalla de inicio</div>

        <section class="options">
            <div class="field-label">Filas por pantalla (4 columnas)</div>
            <div class="segmented rows">
                <button
                    v-for="rows in rowOptions"
                    :key="rows"
                    :class="{ selected: layout.rowsSetting === rows }"
                    @click="layout.rowsSetting = rows">
                    {{ rows === 0 ? `Auto (${layout.autoRows})` : rows }}
                </button>
            </div>
            <div class="field-hint">
                «Auto» elige las filas según el alto de tu pantalla.
                Si reduces las filas, lo que no quepa se mueve a un hueco libre.
            </div>
        </section>

        <template #buttons>
            <GbButton @click="menu.closeAll()">Listo</GbButton>
        </template>

    </GbDialog>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;

// Gingerbread list section header: small caps text on a gray band
.section-title {
    padding: 4px 16px;
    background: linear-gradient(to bottom, #5a5a5a, #454545);
    color: #e0e0e0;
    font-size: 13px;
    font-weight: bold;
}

// small preview of each status bar style (same look as App.vue's .status-bar-bg)
.swatch {
    flex-shrink: 0;
    width: 40px;
    height: 16px;
    border: 1px solid #777;
    border-radius: 2px;

    &.none {
        background:
            linear-gradient(45deg, #444 25%, transparent 25%, transparent 75%, #444 75%) 0 0 / 8px 8px,
            linear-gradient(45deg, #444 25%, #222 25%, #222 75%, #444 75%) 4px 4px / 8px 8px;
    }

    &.gray {
        background: linear-gradient(to bottom, #f2f2f2, #c4c4c4);
    }

    &.blackGradient {
        background: linear-gradient(to bottom, #3c3c3c, #0c0c0c 70%, #000);
    }

    &.white {
        background-color: #fff;
    }

    &.black {
        background-color: #000;
    }
}

.options {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px 12px;

    > .field-label {
        font-size: 13px;
        opacity: 0.75;
    }

    > .field-hint {
        font-size: 12px;
        opacity: 0.55;
    }

    > .height-control {
        display: flex;
        align-items: center;
        gap: 10px;

        > .auto {
            appearance: none;
            flex-shrink: 0;
            min-height: 40px;
            padding: 0 10px;
            border: 1px solid #5a5a5a;
            border-radius: 5px;
            background: linear-gradient(to bottom, #4a4a4a, #333);
            color: #e8e8e8;
            font: inherit;
            font-size: 14px;
            white-space: nowrap;
            cursor: pointer;

            &.selected {
                background: linear-gradient(to bottom, #f4f4f4, #c9c9c9);
                color: #111;
            }

            &:active {
                background: linear-gradient(to bottom, #ffc64d, #ff8a00);
                color: #111;
            }
        }

        // Gingerbread seek bar: orange progress on a dark track
        > input[type="range"] {
            flex: 1;
            min-width: 0;
            height: 32px;
            accent-color: $gingerbread-orange;

            // dimmed while following the automatic height
            &.auto {
                opacity: 0.5;
            }
        }

        > .value {
            flex-shrink: 0;
            width: 44px;
            text-align: right;
            font-size: 14px;
        }
    }

    // "Auto (n)" needs more room than the plain numbers
    > .segmented.rows > button:first-child {
        flex: 2;
    }

    > .segmented {
        display: flex;
        border: 1px solid #5a5a5a;
        border-radius: 5px;
        overflow: hidden;

        > button {
            appearance: none;
            flex: 1;
            min-height: 40px;
            padding: 0 4px;
            border: none;
            border-right: 1px solid #5a5a5a;
            background: linear-gradient(to bottom, #4a4a4a, #333);
            color: #e8e8e8;
            font: inherit;
            font-size: 14px;
            white-space: nowrap;
            cursor: pointer;

            &:last-child {
                border-right: none;
            }

            &.selected {
                background: linear-gradient(to bottom, #f4f4f4, #c9c9c9);
                color: #111;
            }

            &:active {
                background: linear-gradient(to bottom, #ffc64d, #ff8a00);
                color: #111;
            }
        }
    }
}
</style>
