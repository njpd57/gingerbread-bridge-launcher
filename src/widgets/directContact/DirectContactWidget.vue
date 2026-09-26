<script setup lang="ts">
import { computed, ref } from 'vue';
import { useWidgetData } from '@/stores/useWidgetDataStore';
import { useContactsStore } from '@/stores/useContactsStore';
import { searchContacts } from '@/utils/search';
import type { BridgeContact } from '@/types/bridge-fork';
import ContactGlyph from '@/widgets/search/ContactGlyph.vue';
import WidgetDialog from '@/components/WidgetDialog.vue';

// Gingerbread's "Direct dial" / "Direct message" shortcuts (1x1): pick a contact and one of their
// numbers once, and the icon calls or texts that number straight away from then on. Reconfigure by
// removing and re-adding it. Needs our Bridge fork's contacts API.

interface DirectContactData
{
    lookupKey: string;
    name: string;
    number: string;
    label: string | null;
    hasPhoto: boolean;
}

const props = defineProps<{
    widgetId?: string;
    mode: 'call' | 'message';
}>();

const contacts = useContactsStore();

// an empty `lookupKey` means "not configured yet"
const data = useWidgetData<DirectContactData>(() => props.widgetId,
    { lookupKey: '', name: '', number: '', label: null, hasPhoto: false },
    { lookupKey: '', name: 'Contacto', number: '', label: null, hasPhoto: false });

// the picker: every contact with a number is offered as one row per number, so choosing a row
// picks the contact and the number in a single tap
const isPicking = ref(false);
const query = ref('');
const allContacts = ref<BridgeContact[]>([]);

interface NumberRow
{
    contact: BridgeContact;
    number: string;
    label: string | null;
}

const rows = computed<NumberRow[]>(() =>
{
    const matches = query.value.trim() ? searchContacts(allContacts.value, query.value) : allContacts.value;
    return matches.flatMap(c => c.phoneNumbers.map(p => ({ contact: c, number: p.number, label: p.label })));
});

async function openPicker()
{
    if (!props.widgetId || !contacts.canRead) return;
    query.value = '';
    allContacts.value = await contacts.fetchContacts();
    isPicking.value = true;
}

function pick(row: NumberRow)
{
    data.value = {
        lookupKey: row.contact.lookupKey,
        name: row.contact.name,
        number: row.number,
        label: row.label,
        hasPhoto: row.contact.hasPhoto,
    };
    isPicking.value = false;
}

const message = computed(() =>
{
    if (!contacts.isSupported) return 'Necesita nuestro fork de Bridge';
    if (!contacts.canRead) return 'Toca para permitir el acceso a los contactos';
    return null;
});

function onClick()
{
    if (!contacts.isSupported) return;
    if (!contacts.canRead) { contacts.requestAccess(); return; }
    if (!data.value.lookupKey) { openPicker(); return; }
    if (props.mode === 'call')
        contacts.call(data.value.number);
    else
        Bridge.requestOpenUrl(`smsto:${data.value.number}`);
}
</script>

<template>
    <div class="direct-contact-widget">
        <button class="tile" :aria-label="message ?? data.name" @click="onClick">
            <span class="photo">
                <img v-if="data.hasPhoto" :src="contacts.photoUrl(data)" alt="" draggable="false" />
                <ContactGlyph v-else />
                <span class="badge" :class="mode">
                    <svg v-if="mode === 'call'" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                            d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l2-2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.8c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1L6.6 10.8z"
                            fill="currentColor" />
                    </svg>
                    <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="2" y="5" width="20" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
                        <path d="M3 6.5l9 6 9-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </span>
            </span>
            <span class="label">{{ message ? (mode === 'call' ? 'Marcación directa' : 'Mensaje directo') : data.name }}</span>
        </button>

        <WidgetDialog :open="isPicking" :title="mode === 'call' ? 'Marcación directa' : 'Mensaje directo'" @close="isPicking = false">
            <div class="picker">
                <input v-model="query" type="text" placeholder="Buscar contacto" enterkeyhint="search" />
                <div class="rows">
                    <button
                        v-for="row in rows"
                        :key="`${row.contact.lookupKey}-${row.number}`"
                        class="row"
                        @click="pick(row)">
                        <img v-if="row.contact.hasPhoto" :src="contacts.photoUrl(row.contact)" alt="" draggable="false" />
                        <span v-else class="glyph"><ContactGlyph /></span>
                        <span class="texts">
                            <span class="name">{{ row.contact.name }}</span>
                            <span class="number">{{ row.label ? `${row.label} · ` : '' }}{{ row.number }}</span>
                        </span>
                    </button>
                    <div v-if="rows.length === 0" class="empty">Sin resultados</div>
                </div>
            </div>
        </WidgetDialog>
    </div>
</template>

<style scoped lang="scss">
$gb-green: #7ed31b;
$gb-blue: #4a90d9;

.direct-contact-widget {
    display: flex;
    width: 100%;
    height: 100%;

    > .tile {
        appearance: none;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        border: none;
        background: none;
        color: inherit;
        font: inherit;
        cursor: pointer;

        > .photo {
            position: relative;
            display: grid;
            place-items: center;
            width: var(--icon-size, 48px);
            height: var(--icon-size, 48px);
            border-radius: 50%;
            background: #b0b0b0;
            color: #7d7d7d;
            filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.6));

            > img {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
            }

            > :deep(svg:first-child) {
                width: 70%;
                height: 70%;
            }

            > .badge {
                position: absolute;
                right: -2px;
                bottom: -2px;
                display: grid;
                place-items: center;
                width: 40%;
                height: 40%;
                min-width: 16px;
                min-height: 16px;
                border: 2px solid #1a1a1a;
                border-radius: 50%;
                color: #fff;

                &.call {
                    background: $gb-green;
                }

                &.message {
                    background: $gb-blue;
                }

                > svg {
                    width: 65%;
                    height: 65%;
                }
            }
        }

        > .label {
            max-width: 100%;
            padding: 1px 6px;
            border-radius: 6px;
            background-color: rgba(#000, 0.45);
            font-size: 12px;
            line-height: 1.3;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        &:active > .photo {
            filter: drop-shadow(0 0 4px #ffa800) drop-shadow(0 0 2px #ffa800);
        }
    }
}

// teleported into the dialog, outside .direct-contact-widget
.picker {
    display: flex;
    flex-direction: column;

    > input {
        margin: 8px 16px;
        padding: 8px 10px;
        border: 1px solid #ffa800;
        border-radius: 4px;
        background: rgba(#fff, 0.95);
        color: #000;
        font: inherit;
        font-size: 16px;
        outline: none;
    }

    > .rows {
        display: flex;
        flex-direction: column;
        max-height: 50vh;
        overflow-y: auto;

        > .row {
            appearance: none;
            display: flex;
            align-items: center;
            gap: 12px;
            min-height: 56px;
            padding: 6px 16px;
            border: none;
            border-top: 1px solid rgba(#000, 0.12);
            background: none;
            color: inherit;
            font: inherit;
            text-align: left;
            cursor: pointer;

            &:active {
                background: linear-gradient(to bottom, #ffc64d, #ff8a00);
            }

            > img,
            > .glyph {
                flex-shrink: 0;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                object-fit: cover;
            }

            > .glyph {
                display: grid;
                place-items: center;
                background: #b0b0b0;
                color: #7d7d7d;

                > :deep(svg) {
                    width: 26px;
                    height: 26px;
                }
            }

            > .texts {
                display: flex;
                flex-direction: column;
                min-width: 0;

                > .name {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                > .number {
                    overflow: hidden;
                    font-size: 13px;
                    opacity: 0.7;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }
        }

        > .empty {
            padding: 16px;
            text-align: center;
            opacity: 0.7;
        }
    }
}
</style>
