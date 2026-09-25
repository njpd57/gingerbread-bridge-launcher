<template>
    <svg viewBox="0 0 48 48" aria-hidden="true">
        <defs>
            <radialGradient id="browser-globe" cx="0.35" cy="0.3" r="0.8">
                <stop offset="0" stop-color="#d9f79a" />
                <stop offset="0.45" stop-color="#8cc63f" />
                <stop offset="1" stop-color="#2f5d0b" />
            </radialGradient>
        </defs>
        <circle cx="24" cy="24" r="18" fill="url(#browser-globe)" stroke="#23450a" stroke-width="1" />
        <!-- continents -->
        <g fill="#3a4a2a" fill-opacity="0.85">
            <path d="M14 14c3-2 7-2.5 9-1.5 1 2-1 3.5-3 4-1.5.5-1.5 2.5-3.5 3-2 .3-3.3-1.2-3.8-2.8z" />
            <path d="M26 20c3-1 6.5 0 8.5 2.5 1.5 2 .5 4.5-1.5 5-2 .5-2 3-4 4.5-2 1.3-4-.5-4-2.8 0-2-2-3-1.5-5 .3-1.8 1-3.6 2.5-4.2z" />
            <path d="M13 26c2 0 3.5 1.5 4 3.5s-.5 4.5-2 5.5c-1.8-1.5-3.2-4.5-3.5-7 .3-1 .8-2 1.5-2z" />
        </g>
        <!-- gloss -->
        <ellipse cx="20" cy="15" rx="10" ry="6" fill="#fff" fill-opacity="0.3" />
    </svg>
</template>
