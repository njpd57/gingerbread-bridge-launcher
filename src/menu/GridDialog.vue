<script setup lang="ts">
import { useMenuStore } from '@/stores/useMenuStore';
import { MAX_GRID_ROWS, MIN_GRID_ROWS, useHomeLayoutStore } from '@/stores/useHomeLayoutStore';
import GbDialog from '@/components/GbDialog.vue';
import GbButton from '@/components/GbButton.vue';

const menu = useMenuStore();
const layout = useHomeLayoutStore();

// 0 = automatic
const rowOptions = [0, ...Array.from({ length: MAX_GRID_ROWS - MIN_GRID_ROWS + 1 }, (_, i) => MIN_GRID_ROWS + i)];

</script>

<template>
    <GbDialog
        :open="menu.openDialog === 'grid'"
        title="Cuadrícula"
        @close="menu.closeAll()">

        <section class="options">
            <div class="field-label">Filas por pantalla (4 columnas)</div>
            <div class="segmented">
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
.options {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px 8px;

    > .field-label {
        font-size: 13px;
        opacity: 0.75;
    }

    > .field-hint {
        font-size: 12px;
        opacity: 0.55;
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

            &:first-child {
                flex: 2;
            }

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
