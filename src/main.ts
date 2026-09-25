import '@/assets/styles/page.scss';
import '@/assets/styles/base.scss';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import injectBridgeMockInDev from './mock/injectBridgeMockInDev';
import App from './App.vue';

injectBridgeMockInDev();

const app = createApp(App);

app.config.globalProperties.Bridge = Bridge;
app.use(createPinia());

app.mount('#app');

// best effort: a launcher is a portrait app. Browsers usually only allow locking the orientation in
// fullscreen, so inside Bridge's WebView this may well be rejected; the grid copes with landscape anyway.
(screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })
    ?.lock?.('portrait')
    .catch(() => { /* not allowed here */ });
