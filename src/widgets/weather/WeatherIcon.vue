<script setup lang="ts">
import type { WeatherKind } from './weather-codes';

defineProps<{
    kind: WeatherKind;
    isDay: boolean;
}>();

const CLOUD = 'M18 50h30a11 11 0 0 0 0-22 14 14 0 0 0-27-3 10 10 0 0 0-3 25z';

</script>

<template>
    <svg class="weather-icon" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
            <radialGradient id="wi-sun" cx="0.4" cy="0.35" r="0.7">
                <stop offset="0" stop-color="#fff7b0" />
                <stop offset="0.5" stop-color="#ffd21f" />
                <stop offset="1" stop-color="#f08a00" />
            </radialGradient>
            <radialGradient id="wi-moon" cx="0.4" cy="0.35" r="0.7">
                <stop offset="0" stop-color="#ffffff" />
                <stop offset="1" stop-color="#b9c4d6" />
            </radialGradient>
            <linearGradient id="wi-cloud" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#ffffff" />
                <stop offset="1" stop-color="#a9b3bf" />
            </linearGradient>
            <linearGradient id="wi-cloud-dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#9aa3ad" />
                <stop offset="1" stop-color="#4c535c" />
            </linearGradient>
        </defs>

        <!-- sun or moon: full size when clear, small and behind the cloud when partly cloudy -->
        <g
            v-if="kind === 'clear' || kind === 'partly'"
            :transform="kind === 'partly' ? 'translate(-8 -10) scale(0.8)' : undefined">
            <template v-if="isDay">
                <g stroke="#ffc400" stroke-width="3" stroke-linecap="round">
                    <line
                        v-for="a in 8"
                        :key="a"
                        x1="32" y1="6" x2="32" y2="12"
                        :transform="`rotate(${a * 45} 32 32)`" />
                </g>
                <circle cx="32" cy="32" r="14" fill="url(#wi-sun)" />
            </template>
            <path
                v-else
                fill="url(#wi-moon)"
                d="M38 12a20 20 0 1 0 14 30 16 16 0 0 1-14-30z" />
        </g>

        <!-- back cloud for overcast -->
        <path
            v-if="kind === 'cloudy'"
            :d="CLOUD"
            fill="url(#wi-cloud-dark)"
            transform="translate(-8 -8) scale(0.85)" />

        <path
            v-if="kind !== 'clear'"
            :d="CLOUD"
            :fill="kind === 'storm' ? 'url(#wi-cloud-dark)' : 'url(#wi-cloud)'" />

        <g v-if="kind === 'rain'" stroke="#4aa3ff" stroke-width="3" stroke-linecap="round">
            <line x1="24" y1="54" x2="21" y2="61" />
            <line x1="34" y1="54" x2="31" y2="61" />
            <line x1="44" y1="54" x2="41" y2="61" />
        </g>

        <g v-if="kind === 'snow'" fill="#ffffff">
            <circle cx="23" cy="57" r="2.5" />
            <circle cx="33" cy="60" r="2.5" />
            <circle cx="43" cy="57" r="2.5" />
        </g>

        <path
            v-if="kind === 'storm'"
            fill="#ffd21f"
            stroke="#c07000"
            stroke-width="0.8"
            d="M34 44l-8 11h6l-3 9 10-13h-6l4-7z" />

        <g v-if="kind === 'fog'" stroke="#d0d6dd" stroke-width="3" stroke-linecap="round">
            <line x1="12" y1="55" x2="50" y2="55" />
            <line x1="18" y1="61" x2="46" y2="61" />
        </g>
    </svg>
</template>

<style scoped lang="scss">
.weather-icon {
    display: block;
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5));
}
</style>
