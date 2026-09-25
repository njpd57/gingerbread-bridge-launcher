<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { describeWeatherCode } from './weather-codes';
import WeatherIcon from './WeatherIcon.vue';

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

        <form v-if="isEditing" class="city-form" @submit.prevent="submit" @click.stop>
            <input
                ref="inputEl"
                v-model="cityInput"
                type="text"
                enterkeyhint="search"
                placeholder="Escribe tu ciudad"
                @blur="isEditing = false"
                @keydown.esc="isEditing = false" />
        </form>

        <div v-else-if="!weather.city" class="empty">
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
    border-radius: 6px;
    border: 1px solid rgba(#fff, 0.12);
    background: linear-gradient(to bottom, rgba(#000, 0.45), rgba(#000, 0.65));
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

    > .city-form {
        flex: 1;

        > input {
            width: 100%;
            padding: 8px 10px;
            border: 1px solid #ffa800;
            border-radius: 4px;
            background: rgba(#fff, 0.95);
            color: #000;
            font: inherit;
            font-size: 16px;
            text-shadow: none;
            outline: none;
        }
    }
}
</style>
