<template>
    <button class="gb-button" type="button">
        <slot></slot>
    </button>
</template>

<style scoped lang="scss">
// Gingerbread's light gray gradient button, orange when pressed
.gb-button {
    appearance: none;
    min-height: 44px;
    padding: 8px 16px;
    border: 1px solid #5a5a5a;
    border-radius: 5px;
    background: linear-gradient(to bottom, #f4f4f4, #c9c9c9);
    color: #111;
    font: inherit;
    font-size: 15px;
    cursor: pointer;

    &:active {
        border-color: #b35f00;
        background: linear-gradient(to bottom, #ffc64d, #ff8a00);
    }
}
</style>
