# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A recreation of the Android 2.3 **Gingerbread** home screen launcher, built as a web project for [Bridge Launcher](https://github.com/bridgelauncher/launcher). Bridge is an Android app that shows a WebView as the home screen and exposes Android features to it through `window.Bridge`. It started as a fork of Bridge's `api-tester` example and now lives in its own repo (`github.com/njpd57/gingerbread-bridge-launcher`). There is no native Android code here.

`FEATURES.md` is the roadmap: every idea with the Bridge API calls it needs, marked ✅ when done and ◐ when partly done. `README.md` is the user-facing documentation (in Spanish), including the optional permissions.

Stack: Vue 3 (`<script setup>`), TypeScript, Pinia setup stores, VueUse, SCSS, Vite 4 and Vitest. **User-facing text is in Spanish**; code and comments are in English.

## Commands

```bash
npm run dev          # Vite dev server; a BridgeMock stands in for window.Bridge (see below)
npm run build        # type-check (vue-tsc) + vite build -> dist/
npm run type-check   # vue-tsc only
npm run test:unit    # vitest in watch mode (jsdom)
npx vitest run       # all tests once
npx vitest run --dir src   # only this repo's tests (git worktrees under .claude/ would otherwise be picked up too)
npx vitest run src/stores/__tests__/useHomeLayoutStore.spec.ts -t "folders"   # a single file / test
npm run deploy [remote_dir]   # build and adb-push dist/ to the phone (scripts/deploy.sh)
npm run grant-permissions     # adb: grant Bridge WRITE_SECURE_SETTINGS (needed to change the system night mode)
```

To run the launcher on a device, point Bridge's "project dir" setting at a folder containing the contents of `dist/`. The Vite build uses stable, unhashed asset names (`assets/index.js`), so copying a new `dist/` over the old one is enough.

Development happens on the **`dev`** branch. Keep `.claude/` (other agents' worktrees) out of commits.

## Bridge runtime

- `Bridge` is a global that only exists inside Bridge. In development, `src/mock/injectBridgeMockInDev.ts` installs `BridgeMock` from `@bridgelauncher/api-mock`. That mock reads its app list and icons from `public/mock/`, and calls such as `requestLaunchApp` show an `alert`. Types come from `@bridgelauncher/api` (v0.1.0, the latest). `Bridge` is also a Vue global property, so templates can call `Bridge.*` directly.
- **The installed Bridge can lack methods that the API types declare.** Bridge 0.1.0alpha has no `getCanRequestSystemNightMode`, and calling a missing method throws; when that happens while a store is being created, the whole launcher fails to load. Guard any method the launcher didn't already use successfully on the device with `bridgeHas()` from `src/utils/bridge-utils.ts`.
- **Permissions granted outside Bridge don't fire events.** `WRITE_SECURE_SETTINGS` (night mode) is granted over adb, and lock screen needs Bridge's accessibility service; `useTogglesStore` re-reads the permission state on `afterResume`. The user-facing steps are in the README's "Permisos opcionales" section.
- **There is a single `window.onBridgeEvent` handler, and `useBridgeEventStore` owns it.** Everything else subscribes with `bridgeEvents.addEventListener(...)`. Never assign `window.onBridgeEvent` anywhere else.
- **The API can't do these things; don't design features that need them:**
  - Receive back-button events. The drawer uses a `history.pushState` workaround instead.
  - Read media sessions or notifications.
  - Embed native app widgets. All widgets are HTML.
  - Open intents other than launching an app by package name or opening a URL (the latter needs our fork, below).
- **Our Bridge fork ([njpd57/bridge-launcher](https://github.com/njpd57/bridge-launcher)) adds methods** that the published types lack. They are declared by module augmentation in `src/types/bridge-fork.d.ts`, and the dev mock implements them (`ForkBridgeMock` in `src/mock/injectBridgeMockInDev.ts`), so add new fork methods to both. Always call them behind `bridgeHas()` with a fallback for stock Bridge:
  - `requestSetScreenOrientation` / `getScreenOrientation`: `main.ts` locks the home screen to portrait at startup.
  - `getDefaultAppPackageName(role)`: `Dock.vue` uses it for the phone and browser buttons, falling back to a list of known package names.
  - `requestOpenUrl(url)`: the search panel offers a web search (Google), also on Enter when the query doesn't match exactly one app.
- **Window insets are unreliable on the real device.** Bridge reported 0 for the status bar there. `useWindowInsetsStore` resolves the bar heights anyway: it re-reads the insets after startup and on resume, falls back to other insets, then to `env(safe-area-inset-*)` (`index.html` sets `viewport-fit=cover`), then to a minimum. The user can also set a manual status bar height. **For layout, use the CSS variables `--status-bar-height` and `--nav-bar-height`, which are set on `.launcher-root`, not the raw insets.**

## Architecture

`App.vue` stacks absolutely positioned layers, bottom to top:
1. `NexusWallpaper` (a canvas), or nothing when the system wallpaper is selected.
2. `Workspace`: `PAGE_COUNT` (5) horizontally scroll-snapped pages, starting on `DEFAULT_PAGE` (2), each rendering a `HomeGrid`.
3. `Dock`.
4. `AppDrawer`.
5. `FolderPanel`.
6. `DragLayer`.
7. The options menu, the dialogs and the search panel.
8. The status bar: either `statusbar/GingerbreadStatusBar.vue` (our own bar) or a background strip behind the system one.

State lives in Pinia stores under `src/stores/`. Persistent state uses VueUse `useLocalStorage`: `home.items`, `home.gridRows`, `home.autoRows`, `launcher.recentApps`, `settings.*` and `weather.*`.

Widgets live in `src/widgets/<name>/`; `widgets/WidgetView.vue` maps each `WidgetKind` to its component. `WidgetView` also receives the home item id (`widgetId`) for widgets with per-instance data: the photo frame keeps each frame's photo in IndexedDB under that id (`widgets/photo/photo-storage.ts`) and prunes photos of removed frames when a frame mounts.

- **The home screen model is `useHomeLayoutStore`.** It holds a flat list of items (`app` | `widget` | `folder`), each with `page, x, y, w, h`.
  - The grid has `GRID_COLS` (4) columns and a **variable** number of rows. `autoGridRows()` picks the row count from the screen size (Gingerbread's cell proportions, 4–7 rows), and the user can override it.
  - When the row count shrinks, `fitItemsToGrid()` moves items that no longer fit. That move is permanent, so `App.vue` only measures the automatic rows in **portrait**: rotating to landscape keeps the portrait rows (persisted as `home.autoRows`) instead of shrinking the grid. `main.ts` also tries `screen.orientation.lock('portrait')`, which the WebView will probably reject.
  - Widget sizes are defined in `WIDGET_SIZES`. **Adding a widget kind touches three places:** `WidgetKind`/`WIDGET_SIZES`, the render branch in `widgets/WidgetView.vue` (used by both `HomeGrid` and `DragLayer`), and the list in `AddDialog.vue`.
- **Drag and drop runs through `useDragStore`.**
  - Each `HomeGrid` registers its element per page, and the `Dock` registers the trash zone, which replaces the hotseat while a drag is active. Drop targets are computed from those elements' on-screen rectangles.
  - A drag payload comes from one of three sources: `drawer`, `home` or `folder`. `applyDrop()` handles every combination of source and target (cell, folder or trash).
  - While a drag is active, the store listens to pointer events on `window` and cancels `touchmove` (non-passive) so the WebView doesn't scroll under the finger.
  - Click handlers call `drag.justDropped()` to ignore the click that follows a drop.
- **Launch apps through `useAppLauncherStore().launch()`**, never `Bridge.requestLaunchApp` directly: it records recent apps (shown by the search panel when its field is empty).
- **The search widget** opens `widgets/search/SearchPanel.vue` via `menu.showSearch()`; matching lives in `utils/search.ts` (accent- and case-insensitive, ranked). The panel pads itself above the keyboard with `useKeyboardInset()`, which combines Bridge's IME inset with how much the WebView already shrank.
- **Long press is the `useLongPress` composable.** One instance can serve a whole `v-for`. Click handlers must call `consumeLongPress()`, so the click that ends a long press is ignored.
- **`useMenuStore` is the single source of truth for overlays**: the options menu, the open dialog (`LauncherDialog`), the open folder and the search panel.
  - Long-pressing empty workspace opens the options menu. It records the pressed cell as `addAnchor`, which "Añadir" uses to place new items.
  - The Android home button (Bridge's `newIntent` event) is handled in `useWorkspaceStore`. It closes the first open thing in this order: menus (including the search panel), then the drawer; if nothing is open, it returns to the default page.
  - The drawer and the search panel push a history entry when they open, so the back button (which Bridge forwards to the WebView history) closes them. This works on the test device.
- **`useSettingsStore`** holds the launcher's preferences (wallpaper, status bar, overscroll glow, adding icons on install). Whenever it changes a Bridge setting for a feature (hiding the status bar, turning off Bridge's overscroll effect), it saves the previous value and restores it when the feature is turned off.
  - With `addIconOnInstall`, it listens for `appInstalled` and puts the new app's icon in the first free cell (`addAppAnywhere()`), starting on the default page.
  - `gingerbreadOverscroll` draws Gingerbread's orange glow at the ends of scroll containers (`useOverscrollGlow` + `OverscrollGlow.vue`, used by the drawer, the workspace, dialogs, folders and search).
  - Turning on `gingerbreadStatusBar` hides the system status bar through Bridge (remembering the previous appearance so it can be restored), and `App.vue` draws `statusbar/GingerbreadStatusBar.vue` instead.
  - That bar gets battery and connectivity from web APIs (`useDeviceStatus`), because Bridge exposes neither. Signal and Wi-Fi strength can't be read, so `useSimulatedSignal` fakes a slowly drifting level (narrowed by the browser's `effectiveType` estimate when available) plus data activity arrows.
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
- Fonts in `src/assets/fonts/` come from AOSP android-2.3.7_r1 (Apache 2.0, see `NOTICE`): Droid Sans for everything and Clockopia for the digital clock.
- Tests cover pure logic: the layout model, inset parsing, `bridgeHas()`, app search, the month grid and the quote of the day. Keep new logic in pure functions so it can be tested the same way. DOM, canvas and drag behavior are verified in the browser or on the device.
