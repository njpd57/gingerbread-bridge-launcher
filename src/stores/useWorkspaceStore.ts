import { defineStore } from "pinia";
import { ref } from "vue";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { useDrawerStore } from "./useDrawerStore";

export const PAGE_COUNT = 5;
export const DEFAULT_PAGE = 2;

export const useWorkspaceStore = defineStore('workspace', () =>
{
    const bridgeEvents = useBridgeEventStore();
    const drawer = useDrawerStore();

    // updated by Workspace.vue from its scroll position
    const currentPage = ref(DEFAULT_PAGE);

    // horizontal scroll position from 0 (first page) to 1 (last page), used for wallpaper parallax
    const scrollProgress = ref(DEFAULT_PAGE / (PAGE_COUNT - 1));

    // set by goToPage(), consumed (and reset to null) by Workspace.vue
    const pendingPage = ref<number | null>(null);

    function goToPage(page: number)
    {
        pendingPage.value = Math.max(0, Math.min(PAGE_COUNT - 1, page));
    }

    // pressing home while already on the launcher closes the drawer if it's open,
    // otherwise returns to the default page
    bridgeEvents.addEventListener(ev =>
    {
        if (ev.name !== 'newIntent') return;

        if (drawer.isOpen)
            drawer.close();
        else
            goToPage(DEFAULT_PAGE);
    });

    return {
        currentPage,
        scrollProgress,
        pendingPage,
        goToPage,
    };
});
