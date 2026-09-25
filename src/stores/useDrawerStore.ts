import { defineStore } from "pinia";
import { ref } from "vue";

export const useDrawerStore = defineStore('drawer', () =>
{
    const isOpen = ref(false);

    // Bridge has no back button event, so we push a history entry when opening.
    // If Bridge forwards back presses to the WebView's history, back will pop it and close the drawer.
    function open()
    {
        if (isOpen.value) return;
        isOpen.value = true;
        history.pushState({ drawer: true }, '');
    }

    function close()
    {
        if (!isOpen.value) return;
        isOpen.value = false;
        if (history.state?.drawer)
            history.back();
    }

    window.addEventListener('popstate', () =>
    {
        isOpen.value = false;
    });

    return {
        isOpen,
        open,
        close,
    };
});
