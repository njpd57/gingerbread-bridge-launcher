# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A recreation of the Android 2.3 **Gingerbread** home screen launcher, built as a web project for [Bridge Launcher](https://github.com/bridgelauncher/launcher). Bridge is an Android app that shows a WebView as the home screen and exposes Android features to it through `window.Bridge`. This repo started as Bridge's `api-tester` example, so the README still describes that project. There is no native Android code here.

Stack: Vue 3 (`<script setup>`), TypeScript, Pinia setup stores, VueUse, SCSS, Vite 4 and Vitest. **User-facing text is in Spanish**; code and comments are in English.

## Commands

```bash
npm run dev          # Vite dev server; a BridgeMock stands in for window.Bridge (see below)
npm run build        # type-check (vue-tsc) + vite build -> dist/
npm run type-check   # vue-tsc only
npm run test:unit    # vitest in watch mode (jsdom)
npx vitest run       # all tests once
npx vitest run src/stores/__tests__/useHomeLayoutStore.spec.ts -t "folders"   # a single file / test
npm run deploy [remote_dir]   # build and adb-push dist/ to the phone (scripts/deploy.sh)
```

To run the launcher on a device, point Bridge's "project dir" setting at a folder containing the contents of `dist/`. The Vite build uses stable, unhashed asset names (`assets/index.js`), so copying a new `dist/` over the old one is enough.

## Bridge runtime

- `Bridge` is a global that only exists inside Bridge. In development, `src/mock/injectBridgeMockInDev.ts` installs `BridgeMock` from `@bridgelauncher/api-mock`. That mock reads its app list and icons from `public/mock/`, and calls such as `requestLaunchApp` show an `alert`. Types come from `@bridgelauncher/api` (v0.1.0, the latest). `Bridge` is also a Vue global property, so templates can call `Bridge.*` directly.
- **There is a single `window.onBridgeEvent` handler, and `useBridgeEventStore` owns it.** Everything else subscribes with `bridgeEvents.addEventListener(...)`. Never assign `window.onBridgeEvent` anywhere else.
- **The API can't do these things; don't design features that need them:**
  - Receive back-button events. The drawer uses a `history.pushState` workaround instead.
  - Read media sessions or notifications.
  - Embed native app widgets. All widgets are HTML.
  - Open URLs or intents other than launching an app by package name.
  - Tell which apps are the default dialer or browser. `Dock.vue` tries a list of known package names instead.
- **Window insets are unreliable on the real device.** Bridge reported 0 for the status bar there. `useWindowInsetsStore` resolves the bar heights anyway: it re-reads the insets after startup and on resume, falls back to other insets, then to `env(safe-area-inset-*)` (`index.html` sets `viewport-fit=cover`), then to a minimum. The user can also set a manual status bar height. **For layout, use the CSS variables `--status-bar-height` and `--nav-bar-height`, which are set on `.launcher-root`, not the raw insets.**

## Architecture

`App.vue` stacks absolutely positioned layers, bottom to top:
1. `NexusWallpaper` (a canvas), or nothing when the system wallpaper is selected.
2. `Workspace`: `PAGE_COUNT` (5) horizontally scroll-snapped pages, starting on `DEFAULT_PAGE` (2), each rendering a `HomeGrid`.
3. `Dock`.
4. `AppDrawer`.
5. `FolderPanel`.
6. `DragLayer`.
7. The options menu and dialogs.
8. The status bar background strip.

State lives in Pinia stores under `src/stores/`. Persistent state uses VueUse `useLocalStorage`: `home.items`, `home.gridRows`, `settings.*` and `weather.*`.

- **The home screen model is `useHomeLayoutStore`.** It holds a flat list of items (`app` | `widget` | `folder`), each with `page, x, y, w, h`.
  - The grid has `GRID_COLS` (4) columns and a **variable** number of rows. `autoGridRows()` picks the row count from the screen size (Gingerbread's cell proportions, 4–7 rows), and the user can override it.
  - When the row count shrinks, `fitItemsToGrid()` moves items that no longer fit.
  - Widget sizes are defined in `WIDGET_SIZES`. **Adding a widget kind touches four places:** `WidgetKind`/`WIDGET_SIZES`, the render branches in `HomeGrid.vue` and `DragLayer.vue`, and the list in `AddDialog.vue`.
- **Drag and drop runs through `useDragStore`.**
  - Each `HomeGrid` registers its element per page, and the `Dock` registers the trash zone, which replaces the hotseat while a drag is active. Drop targets are computed from those elements' on-screen rectangles.
  - A drag payload comes from one of three sources: `drawer`, `home` or `folder`. `applyDrop()` handles every combination of source and target (cell, folder or trash).
  - While a drag is active, the store listens to pointer events on `window` and cancels `touchmove` (non-passive) so the WebView doesn't scroll under the finger.
  - Click handlers call `drag.justDropped()` to ignore the click that follows a drop.
- **Long press is the `useLongPress` composable.** One instance can serve a whole `v-for`. Click handlers must call `consumeLongPress()`, so the click that ends a long press is ignored.
- **`useMenuStore` is the single source of truth for overlays**: the options menu, the open dialog (`LauncherDialog`) and the open folder.
  - Long-pressing empty workspace opens the options menu. It records the pressed cell as `addAnchor`, which "Añadir" uses to place new items.
  - The Android home button (Bridge's `newIntent` event) is handled in `useWorkspaceStore`. It closes the first open thing in this order: menus, then the drawer; if nothing is open, it returns to the default page.
- **`useSettingsStore`** holds the wallpaper and status bar preferences.
  - Choosing a wallpaper also switches Bridge's "draw system wallpaper behind WebView" setting (through `useTogglesStore`) to match.
  - With the system wallpaper, it also sends wallpaper scroll offsets.
- **The weather widget uses Open-Meteo** (geocoding and forecast, no API key). The city and the last result are cached in localStorage, and it refreshes when the data is stale and on resume.

## Conventions

- Brace style is Allman (the opening brace on its own line), with 4-space indentation, in both TS and Vue files.
- **Gingerbread look:**
  - The pressed state is orange (`#ffa800`, gradient `#ffc64d → #ff8a00`), both as a background and as an icon `drop-shadow` glow.
  - Dialogs, buttons and radio rows reuse `GbDialog`, `GbButton` and `GbRadioRow` from `src/components/`.
  - Icons are inline SVG Vue components, under `src/home/icons/` and in the widgets' folders.
- `src/assets/styles/shared/vars.scss` (durations and easings such as `$ease-mat-decel`) is auto-injected into every SCSS block by `vite.config.ts`.
- Tests cover the pure store logic (the layout model, inset parsing). DOM, canvas and drag behavior are verified in the browser or on the device.
