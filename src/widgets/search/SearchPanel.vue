<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useAppsStore, type InstalledAppInfo } from '@/stores/useAppsStore';
import { useAppLauncherStore } from '@/stores/useAppLauncherStore';
import { useMenuStore } from '@/stores/useMenuStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useKeyboardInset } from '@/composables/useKeyboardInset';
import { useOverscrollGlow } from '@/composables/useOverscrollGlow';
import { searchApps } from '@/utils/search';
import { bridgeHas } from '@/utils/bridge-utils';
import OverscrollGlow from '@/components/OverscrollGlow.vue';
import SearchGlyph from './SearchGlyph.vue';

// Full-screen app search, styled after Gingerbread's Quick Search Box: the search bar at the top
// with the keyboard up, and a white list of results that filters as you type.

const apps = useAppsStore();
const launcher = useAppLauncherStore();
const menu = useMenuStore();
const settings = useSettingsStore();

const query = ref('');
const inputEl = ref<HTMLInputElement>();
const listEl = ref<HTMLElement>();

const keyboardInset = useKeyboardInset();
const glow = useOverscrollGlow(listEl, 'y', () => settings.gingerbreadOverscroll);

const results = computed(() => searchApps(apps.apps.values(), query.value));

// with an empty field, show the recently launched apps that are still installed
const recentApps = computed(() => launcher.recent
    .map(p => apps.apps.get(p))
    .filter((a): a is InstalledAppInfo => !!a));

const isQueryEmpty = computed(() => query.value.trim() === '');

// v-model waits for the keyboard's composition (the underlined word) to end, which on Android means
// until space; the input event fires on every letter
function onInput(e: Event)
{
    query.value = (e.target as HTMLInputElement).value;
}

// only our Bridge fork can open URLs
const canSearchWeb = bridgeHas('requestOpenUrl');
const shownApps = computed(() => isQueryEmpty.value ? recentApps.value : results.value);

watch(() => menu.isSearchOpen, async open =>
{
    if (!open) return;
    query.value = '';
    await nextTick();
    inputEl.value?.focus();
});

function launch(app: InstalledAppInfo)
{
    menu.closeAll();
    launcher.launch(app.packageName);
}

function searchWeb()
{
    const url = `https://www.google.com/search?q=${encodeURIComponent(query.value.trim())}`;
    if (Bridge.requestOpenUrl(url))
        menu.closeAll();
}

// "Enter" on the keyboard opens the app when there's exactly one match, and searches the web otherwise
function onSubmit()
{
    if (results.value.length === 1)
        launch(results.value[0]);
    else if (canSearchWeb && !isQueryEmpty.value)
        searchWeb();
}

function clear()
{
    query.value = '';
    inputEl.value?.focus();
}

</script>

<template>
    <Transition name="search">
        <div
            v-if="menu.isSearchOpen"
            class="search-panel"
            :style="{ 'padding-bottom': `max(var(--nav-bar-height), ${keyboardInset}px)` }"
            @click.self="menu.closeAll()">

            <form class="bar" role="search" @submit.prevent="onSubmit">
                <span class="badge"><SearchGlyph /></span>
                <input
                    ref="inputEl"
                    :value="query"
                    type="search"
                    enterkeyhint="go"
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
                    placeholder="Buscar aplicaciones"
                    aria-label="Buscar aplicaciones"
                    @input="onInput" />
                <button v-if="!isQueryEmpty" type="button" class="clear" aria-label="Borrar" @click="clear">×</button>
            </form>

            <div v-if="shownApps.length > 0 || !isQueryEmpty" class="results-wrap">
                <div class="results" ref="listEl">
                    <div v-if="isQueryEmpty" class="section">Aplicaciones recientes</div>

                    <button
                        v-for="app in shownApps"
                        :key="app.packageName"
                        class="row"
                        @click="launch(app)">
                        <img :src="Bridge.getDefaultAppIconURL(app.packageName)" alt="" draggable="false" />
                        <span class="label">{{ app.label }}</span>
                    </button>

                    <div v-if="!isQueryEmpty && results.length === 0" class="empty">
                        No se encontraron aplicaciones
                    </div>

                    <button v-if="canSearchWeb && !isQueryEmpty" class="row web" @click="searchWeb">
                        <span class="web-icon"><SearchGlyph /></span>
                        <span class="label">Buscar «{{ query.trim() }}» en la web</span>
                    </button>
                </div>
                <OverscrollGlow edge="top" :intensity="glow.start.value" :pulling="glow.pulling.value" />
                <OverscrollGlow edge="bottom" :intensity="glow.end.value" :pulling="glow.pulling.value" />
            </div>
        </div>
    </Transition>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;

.search-panel {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: calc(var(--status-bar-height) + 8px) 8px 0;
    background-color: rgba(#000, 0.75);

    // same look as the search widget, with a real text field
    > .bar {
        display: flex;
        align-items: stretch;
        flex-shrink: 0;
        height: 52px;
        padding: 4px;
        border: 1px solid rgba(#000, 0.5);
        border-radius: 6px;
        background: linear-gradient(to bottom, #f4f4f4, #cfcfcf);
        box-shadow: 0 3px 8px rgba(#000, 0.5);

        > .badge {
            display: grid;
            place-items: center;
            width: 44px;
            margin-right: 4px;
            border: 1px solid #1f4f99;
            border-radius: 4px;
            background: linear-gradient(to bottom, #6fa0e8, #2f67c5);
            color: #fff;

            > :deep(svg) {
                width: 26px;
                height: 26px;
            }
        }

        > input {
            flex: 1;
            min-width: 0;
            padding: 0 12px;
            border: 1px solid $gingerbread-orange;
            border-radius: 3px;
            background: #fff;
            box-shadow: inset 0 1px 2px rgba(#000, 0.25);
            color: #111;
            font: inherit;
            font-size: 18px;
            outline: none;

            &::-webkit-search-cancel-button {
                display: none;
            }
        }

        > .clear {
            appearance: none;
            width: 40px;
            border: none;
            background: none;
            color: #555;
            font-size: 28px;
            line-height: 1;
            cursor: pointer;
        }
    }

    // Gingerbread's suggestion list: white rows with dark text and light dividers
    > .results-wrap {
        position: relative;
        display: flex;
        flex-direction: column;
        min-height: 0;
        margin-bottom: 8px;

        > .results {
            overflow-y: auto;
            overscroll-behavior: contain;
            border-radius: 4px;
            background-color: #fafafa;
            box-shadow: 0 3px 8px rgba(#000, 0.5);

            > .section {
                padding: 4px 12px;
                background: linear-gradient(to bottom, #e0e0e0, #cfcfcf);
                color: #444;
                font-size: 13px;
                font-weight: bold;
            }

            > .row {
                appearance: none;
                display: flex;
                align-items: center;
                gap: 12px;
                width: 100%;
                min-height: 56px;
                padding: 6px 12px;
                border: none;
                border-bottom: 1px solid #ddd;
                background: none;
                color: #222;
                font: inherit;
                font-size: 17px;
                text-align: left;
                cursor: pointer;

                &:last-child {
                    border-bottom: none;
                }

                > img,
                > .web-icon {
                    flex-shrink: 0;
                    width: 40px;
                    height: 40px;
                }

                > .web-icon {
                    display: grid;
                    place-items: center;
                    color: #2f67c5;

                    > :deep(svg) {
                        width: 28px;
                        height: 28px;
                    }
                }

                &:active {
                    background: linear-gradient(to bottom, #ffc64d, #ff8a00);
                }
            }

            > .empty {
                padding: 20px 12px;
                color: #777;
                text-align: center;
            }
        }
    }
}

.search-enter-active,
.search-leave-active {
    transition: opacity 0.15s;
}

.search-enter-from,
.search-leave-to {
    opacity: 0;
}
</style>
