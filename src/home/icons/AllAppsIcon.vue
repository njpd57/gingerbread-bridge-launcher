<template>
    <svg viewBox="0 0 48 48" aria-hidden="true">
        <!-- 4x4 grid of small squares -->
        <template v-for="row in 4" :key="row">
            <rect
                v-for="col in 4"
                :key="col"
                :x="7 + (col - 1) * 9.5"
                :y="7 + (row - 1) * 9.5"
                width="6"
                height="6"
                rx="0.8"
                fill="#f2f2f2" />
        </template>
    </svg>
</template>
