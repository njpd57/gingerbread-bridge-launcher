<script setup lang="ts">
import { computed } from 'vue';
import { useNow } from '@vueuse/core';

// Big digital time with the date underneath, like the Android 2.x lock screen clock
// (Clockopia digits, 12-hour with a small AM/PM, like the Gingerbread status bar).

const now = useNow({ interval: 1000 });

const time = computed(() =>
{
    const h = now.value.getHours();
    const m = now.value.getMinutes();
    return {
        hm: `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')}`,
        ampm: h < 12 ? 'AM' : 'PM',
    };
});

// "jueves, 25 de septiembre" -> "Jueves, 25 de septiembre"
const date = computed(() =>
{
    const s = now.value.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
});

</script>

<template>
    <div class="digital-clock">
        <div class="time">
            <span class="hm">{{ time.hm }}</span>
            <span class="ampm">{{ time.ampm }}</span>
        </div>
        <div class="date">{{ date }}</div>
    </div>
</template>

<style scoped lang="scss">
.digital-clock {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    color: #fff;
    text-shadow: 0 2px 4px rgba(#000, 0.8);

    > .time {
        display: flex;
        align-items: baseline;
        gap: 6px;
        line-height: 1;

        > .hm {
            font-family: "Clockopia", "Droid Sans", sans-serif;
            font-size: 64px;
        }

        > .ampm {
            font-family: "Droid Sans", sans-serif;
            font-weight: bold;
            font-size: 18px;
        }
    }

    > .date {
        font-size: 16px;
        color: rgba(#fff, 0.9);
    }
}
</style>
