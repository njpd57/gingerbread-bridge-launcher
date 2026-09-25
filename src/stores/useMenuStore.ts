import { defineStore } from "pinia";
import { computed, ref } from "vue";

export type LauncherDialog = 'wallpaper';

export const useMenuStore = defineStore('menu', () =>
{
    const isOptionsMenuOpen = ref(false);
    const openDialog = ref<LauncherDialog | null>(null);

    const isAnythingOpen = computed(() => isOptionsMenuOpen.value || openDialog.value !== null);

    function showOptionsMenu()
    {
        isOptionsMenuOpen.value = true;
    }

    function showDialog(dialog: LauncherDialog)
    {
        isOptionsMenuOpen.value = false;
        openDialog.value = dialog;
    }

    function closeAll()
    {
        isOptionsMenuOpen.value = false;
        openDialog.value = null;
    }

    return {
        isOptionsMenuOpen,
        openDialog,
        isAnythingOpen,
        showOptionsMenu,
        showDialog,
        closeAll,
    };
});
