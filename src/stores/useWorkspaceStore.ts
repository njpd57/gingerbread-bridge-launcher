import { defineStore } from "pinia";
import { ref } from "vue";
import { useBridgeEventStore } from "./useBridgeEventStore";

export const PAGE_COUNT = 5;
export const DEFAULT_PAGE = 2;

export const useWorkspaceStore = defineStore('workspace', () =>
{
    const bridgeEvents = useBridgeEventStore();

    // updated by Workspace.vue from its scroll position
    const currentPage = ref(DEFAULT_PAGE);

    // set by goToPage(), consumed (and reset to null) by Workspace.vue
    const pendingPage = ref<number | null>(null);

    function goToPage(page: number)
    {
        pendingPage.value = Math.max(0, Math.min(PAGE_COUNT - 1, page));
    }

    // pressing home while already on the launcher returns to the default page
    bridgeEvents.addEventListener(ev =>
    {
        if (ev.name === 'newIntent')
            goToPage(DEFAULT_PAGE);
    });

    return {
        currentPage,
        pendingPage,
        goToPage,
    };
});
