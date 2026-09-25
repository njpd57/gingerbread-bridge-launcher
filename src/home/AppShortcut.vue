<script setup lang="ts">
defineProps<{
    packageName: string;
    label: string;
}>();
</script>

<template>
    <div class="app-shortcut">
        <img :src="Bridge.getDefaultAppIconURL(packageName)" alt="" draggable="false" />
        <span class="label">{{ label }}</span>
    </div>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;

.app-shortcut {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    height: 100%;

    > img {
        width: 48px;
        height: 48px;
        transition: filter 0.1s;
    }

    // Gingerbread draws home screen labels on a dark translucent bubble
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
}
</style>
