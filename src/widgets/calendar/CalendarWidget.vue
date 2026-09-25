<script setup lang="ts">
import { computed, ref } from 'vue';
import { useNow } from '@vueuse/core';
import { monthGrid } from './month-grid';

// The current month's grid (4x2), today circled in Gingerbread orange, with arrows to browse
// months. Tapping the month name returns to today. No events: the API can't read the calendar.

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const now = useNow({ interval: 60_000 });

// months away from the current one
const offset = ref(0);

const shown = computed(() =>
{
    const d = new Date(now.value.getFullYear(), now.value.getMonth() + offset.value, 1);
    return { year: d.getFullYear(), month: d.getMonth(), date: d };
});

const title = computed(() => shown.value.date.toLocaleDateString('es', { month: 'long', year: 'numeric' }));

const days = computed(() => monthGrid(shown.value.year, shown.value.month, now.value));

</script>

<template>
    <div class="calendar-widget">
        <header>
            <button class="arrow" aria-label="Mes anterior" @click="offset--">‹</button>
            <button class="title" :class="{ away: offset !== 0 }" @click="offset = 0">{{ title }}</button>
            <button class="arrow" aria-label="Mes siguiente" @click="offset++">›</button>
        </header>

        <div class="grid">
            <span v-for="w in WEEKDAYS" :key="w" class="weekday">{{ w }}</span>
            <span
                v-for="(d, i) in days"
                :key="i"
                class="day"
                :class="{ out: !d.inMonth, today: d.isToday }">
                {{ d.day }}
            </span>
        </div>
    </div>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;

// same translucent panel as the weather widget
.calendar-widget {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 6px 8px 8px;
    border: 1px solid rgba(#fff, 0.12);
    border-radius: 6px;
    background: linear-gradient(to bottom, rgba(#000, 0.45), rgba(#000, 0.65));
    text-shadow: 0 1px 2px #000;

    button {
        appearance: none;
        border: none;
        background: none;
        color: inherit;
        font: inherit;
        text-shadow: inherit;
        cursor: pointer;

        &:active {
            color: $gingerbread-orange;
        }
    }

    > header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;

        > .arrow {
            width: 40px;
            height: 30px;
            font-size: 26px;
            line-height: 1;
        }

        > .title {
            font-size: 16px;
            font-weight: bold;
            text-transform: capitalize;

            // browsing another month: the title reads as "go back to today"
            &.away {
                color: $gingerbread-orange;
            }
        }
    }

    > .grid {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        grid-template-rows: auto repeat(6, 1fr);
        align-items: center;
        justify-items: center;
        font-size: 13px;

        > .weekday {
            padding-bottom: 2px;
            color: rgba(#fff, 0.6);
            font-size: 11px;
            font-weight: bold;
        }

        > .day {
            display: grid;
            place-items: center;
            width: 1.9em;
            height: 1.9em;
            border-radius: 50%;

            &.out {
                color: rgba(#fff, 0.3);
            }

            &.today {
                background: linear-gradient(to bottom, #ffc64d, #ff8a00);
                color: #111;
                font-weight: bold;
                text-shadow: none;
            }
        }
    }
}
</style>
