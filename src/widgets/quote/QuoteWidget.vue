<script setup lang="ts">
import { computed } from 'vue';
import { useNow } from '@vueuse/core';
import { quoteOfTheDay } from './quotes';

// A quote that changes every day (4x1), from a list bundled with the launcher (no network).

const now = useNow({ interval: 60_000 });
const quote = computed(() => quoteOfTheDay(now.value));
</script>

<template>
    <figure class="quote-widget">
        <blockquote>«{{ quote.text }}»</blockquote>
        <figcaption>— {{ quote.author }}</figcaption>
    </figure>
</template>

<style scoped lang="scss">
// same translucent panel as the weather widget
.quote-widget {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    min-height: 72px;
    margin: 0;
    padding: 8px 12px;
    border: 1px solid rgba(#fff, 0.12);
    border-radius: 6px;
    background: linear-gradient(to bottom, rgba(#000, 0.45), rgba(#000, 0.65));
    text-shadow: 0 1px 2px #000;

    > blockquote {
        margin: 0;
        font-size: 15px;
        font-style: italic;
        line-height: 1.3;
        // up to three lines
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    > figcaption {
        align-self: flex-end;
        font-size: 13px;
        color: rgba(#fff, 0.7);
    }
}
</style>
