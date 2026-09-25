import { defineStore } from "pinia";
import { computed, ref } from "vue";

export type LauncherDialog = 'wallpaper' | 'add' | 'appearance' | 'manageApps';

export interface AddAnchor
{
    page: number;
    x: number;
    y: number;
}

export const useMenuStore = defineStore('menu', () =>
{
    const isOptionsMenuOpen = ref(false);
    const openDialog = ref<LauncherDialog | null>(null);
    const openFolderId = ref<string | null>(null);

    // the cell that was long-pressed to open the menu; "Añadir" places new items there if it can
    const addAnchor = ref<AddAnchor | null>(null);

    const isAnythingOpen = computed(() =>
        isOptionsMenuOpen.value || openDialog.value !== null || openFolderId.value !== null);

    function showOptionsMenu(anchor: AddAnchor | null = null)
    {
        addAnchor.value = anchor;
        isOptionsMenuOpen.value = true;
    }

    function showFolder(id: string)
    {
        closeAll();
        openFolderId.value = id;
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
        openFolderId.value = null;
    }

    return {
        isOptionsMenuOpen,
        openDialog,
        openFolderId,
        addAnchor,
        isAnythingOpen,
        showOptionsMenu,
        showFolder,
        showDialog,
        closeAll,
    };
});
