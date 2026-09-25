<script setup lang="ts">
defineProps<{
    open: boolean;
    title: string;
}>();

const emit = defineEmits<{
    close: [];
}>();

</script>

<template>
    <Transition name="dialog">
        <div v-if="open" class="gb-dialog-overlay" @click.self="emit('close')">
            <div class="gb-dialog" role="dialog" :aria-label="title">
                <header class="title">{{ title }}</header>
                <div class="body">
                    <slot></slot>
                </div>
                <footer v-if="$slots.buttons" class="buttons">
                    <slot name="buttons"></slot>
                </footer>
            </div>
        </div>
    </Transition>
</template>

<style scoped lang="scss">
.gb-dialog-overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 16px;
    background-color: rgba(#000, 0.6);
}

// Gingerbread AlertDialog: dark body, title separated by a thin line, gray button bar
.gb-dialog {
    width: min(100%, 340px);
    max-height: 90%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #6a6a6a;
    border-radius: 6px;
    background-color: #2b2b2b;
    box-shadow: 0 6px 24px rgba(#000, 0.7);

    > .title {
        padding: 14px 16px;
        border-bottom: 2px solid #9a9a9a;
        font-size: 19px;
        color: #fff;
    }

    > .body {
        overflow-y: auto;
        padding: 8px 0;
    }

    > .buttons {
        display: flex;
        gap: 6px;
        padding: 6px;
        background: linear-gradient(to bottom, #9a9a9a, #7a7a7a);

        > :deep(*) {
            flex: 1;
        }
    }
}

.dialog-enter-active,
.dialog-leave-active {
    transition: opacity 0.15s;

    > .gb-dialog {
        transition: transform 0.15s $ease-mat-decel;
    }
}

.dialog-enter-from,
.dialog-leave-to {
    opacity: 0;

    > .gb-dialog {
        transform: scale(0.9);
    }
}
</style>
