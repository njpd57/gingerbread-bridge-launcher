<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import { PAGE_COUNT, useWorkspaceStore } from '@/stores/useWorkspaceStore';

const workspace = useWorkspaceStore();

const el = ref<HTMLElement>();

function scrollToPage(page: number, smooth: boolean)
{
    if (!el.value) return;
    el.value.scrollTo({
        left: page * el.value.clientWidth,
        behavior: smooth ? 'smooth' : 'instant',
    });
}

function onScroll()
{
    if (!el.value || el.value.clientWidth === 0) return;
    const { scrollLeft, scrollWidth, clientWidth } = el.value;
    workspace.currentPage = Math.round(scrollLeft / clientWidth);
    const maxScroll = scrollWidth - clientWidth;
    workspace.scrollProgress = maxScroll > 0 ? scrollLeft / maxScroll : 0.5;
}

onMounted(() => scrollToPage(workspace.currentPage, false));

// keep the current page in place when the screen size changes (e.g. rotation)
useResizeObserver(el, () => scrollToPage(workspace.currentPage, false));

watch(() => workspace.pendingPage, page =>
{
    if (page === null) return;
    scrollToPage(page, true);
    workspace.pendingPage = null;
});

</script>

<template>
    <div class="workspace" ref="el" @scroll.passive="onScroll">
        <section
            v-for="i in PAGE_COUNT"
            :key="i"
            class="page">
            <slot :page="i - 1"></slot>
        </section>
    </div>
</template>

<style scoped lang="scss">
.workspace {
    display: flex;
    width: 100%;
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    > .page {
        flex: 0 0 100%;
        height: 100%;
        scroll-snap-align: start;
        scroll-snap-stop: always;
    }
}
</style>
