<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { describeWeatherCode } from './weather-codes';
import WeatherIcon from './WeatherIcon.vue';
import GbDialog from '@/components/GbDialog.vue';
import GbButton from '@/components/GbButton.vue';

const weather = useWeatherStore();

const description = computed(() => weather.data ? describeWeatherCode(weather.data.code) : null);

const isEditing = ref(false);
const cityInput = ref('');
const inputEl = ref<HTMLInputElement>();

async function startEditing()
{
    cityInput.value = weather.city?.name ?? '';
    isEditing.value = true;
    await nextTick();
    inputEl.value?.focus();
    inputEl.value?.select();
}

function submit()
{
    isEditing.value = false;
    if (cityInput.value.trim())
        weather.setCityAsync(cityInput.value);
}

function onWidgetClick()
{
    if (!weather.city)
        startEditing();
    else
        weather.refreshAsync();
}

</script>

<template>
    <div class="weather-widget" @click="onWidgetClick">

        <!-- a dialog rather than a field in the widget: the widget can sit low on the screen, where
             the keyboard would cover it, while the dialog recenters above the keyboard. Mounted only
             while editing, since .launcher-root doesn't exist yet when the widgets first mount. -->
        <Teleport v-if="isEditing" to=".launcher-root">
            <GbDialog open title="Ciudad del tiempo" @close="isEditing = false">
                <form class="city-form" @submit.prevent="submit">
                    <input
                        ref="inputEl"
                        v-model="cityInput"
                        type="text"
                        enterkeyhint="search"
                        placeholder="Escribe tu ciudad"
                        aria-label="Ciudad"
                        @keydown.esc="isEditing = false" />
                </form>
                <template #buttons>
                    <GbButton @click="isEditing = false">Cancelar</GbButton>
                    <GbButton @click="submit">Aceptar</GbButton>
                </template>
            </GbDialog>
        </Teleport>

        <div v-if="!weather.city" class="empty">
            Toca para elegir tu ciudad
        </div>

        <template v-else>
            <WeatherIcon
                v-if="description && weather.data"
                class="icon"
                :kind="description.kind"
                :is-day="weather.data.isDay" />

            <div v-if="weather.data" class="temperature">
                {{ Math.round(weather.data.temperature) }}°
            </div>

            <div class="details">
                <button class="city" @click.stop="startEditing">{{ weather.city.name }}</button>
                <div v-if="description" class="condition">{{ description.label }}</div>
                <div v-if="weather.data" class="range">
                    {{ Math.round(weather.data.max) }}° / {{ Math.round(weather.data.min) }}°
                </div>
                <div v-if="weather.status === 'loading'" class="status">Actualizando…</div>
                <div v-else-if="weather.status === 'error'" class="status error">{{ weather.errorMessage }}</div>
            </div>
        </template>

    </div>
</template>

<style scoped lang="scss">
.weather-widget {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 88px;
    padding: 10px 14px;
    // the power control's glossy panel
    @include gb-widget-glossy;
    text-shadow: 0 1px 2px #000;
    cursor: pointer;

    > .icon {
        flex-shrink: 0;
        width: 64px;
        height: 64px;
    }

    > .temperature {
        font-size: 44px;
        line-height: 1;
        font-weight: 300;
    }

    > .details {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        margin-left: auto;
        text-align: right;
        font-size: 13px;

        > .city {
            appearance: none;
            border: none;
            background: none;
            padding: 0;
            color: inherit;
            font: inherit;
            font-size: 16px;
            font-weight: bold;
            text-shadow: inherit;
            cursor: pointer;
        }

        > .condition,
        > .range {
            color: rgba(#fff, 0.85);
        }

        > .status {
            font-size: 11px;
            color: rgba(#fff, 0.6);

            &.error {
                color: #ffb74d;
            }
        }
    }

    > .empty {
        flex: 1;
        text-align: center;
        color: rgba(#fff, 0.8);
    }
}

// teleported into the dialog, outside .weather-widget
.city-form {
    padding: 8px 16px;

    > input {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #ffa800;
        border-radius: 4px;
        background: rgba(#fff, 0.95);
        color: #000;
        font: inherit;
        font-size: 16px;
        outline: none;
    }
}
</style>
