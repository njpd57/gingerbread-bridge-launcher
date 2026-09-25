<script setup lang="ts">
defineProps<{
    name: string;
    value: string;
    modelValue: string;
    label: string;
    hint?: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();
</script>

<template>
    <label class="gb-radio-row">
        <slot name="icon"></slot>
        <span class="text">
            <span class="label">{{ label }}</span>
            <span v-if="hint" class="hint">{{ hint }}</span>
        </span>
        <input
            type="radio"
            :name="name"
            :value="value"
            :checked="modelValue === value"
            @change="emit('update:modelValue', value)" />
    </label>
</template>

<style scoped lang="scss">
$gingerbread-green: #8fd400;

// a Gingerbread list row with a radio button on the right
.gb-radio-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 16px;
    border-bottom: 1px solid rgba(#fff, 0.1);
    cursor: pointer;

    &:active {
        background: linear-gradient(to bottom, #ffc64d, #ff8a00);
        color: #111;
    }

    > .text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;

        > .label {
            font-size: 17px;
        }

        > .hint {
            font-size: 13px;
            opacity: 0.65;
        }
    }

    // Gingerbread radio: gray bezel with a green dot when checked
    > input {
        appearance: none;
        flex-shrink: 0;
        width: 26px;
        height: 26px;
        margin: 0;
        border: 2px solid #8a8a8a;
        border-radius: 50%;
        background: radial-gradient(circle, #555 0%, #2a2a2a 100%);

        &:checked {
            background: radial-gradient(circle, $gingerbread-green 0 42%, #2a2a2a 48% 100%);
            border-color: #bdbdbd;
        }
    }
}
</style>
