# Funciones posibles con la API de Bridge

**Estado:** las ideas 1 a 5 ya están implementadas (marcadas con ✅).

Revisión de todo lo que ofrece `@bridgelauncher/api` v0.1.0 (la última publicada), qué usa ya el launcher y qué se podría agregar. Las ideas van ordenadas por lo bien que encajan con Gingerbread y por el esfuerzo que requieren.

## Qué usamos y qué no

| Área | Ya se usa | Sin usar |
|---|---|---|
| Apps | `getAppsURL`, `getDefaultAppIconURL`, `requestLaunchApp`, eventos `appInstalled` / `appChanged` / `appRemoved` | `requestAppUninstall`, `requestOpenAppInfo` |
| Fondo de pantalla | `setWallpaperOffsetSteps`, `setWallpaperOffsets`, `requestChangeSystemWallpaper`, dibujar el fondo del sistema detrás del WebView | `sendWallpaperTap` |
| Barras del sistema | Apariencia de la barra de estado, insets de barras y del recorte de la cámara | Insets del teclado (`ime*`), gestos (`systemGestures`, `mandatorySystemGestures`), `tappableElement`, `captionBar`, `waterfall`, `getDisplayCutoutPath`, `getDisplayShapePath` |
| Ajustes de Bridge | Visibilidad del botón de Bridge (en el store de ajustes también se leen el tema, el modo noche y los efectos de overscroll) | Todavía no hay interfaz para: efectos de overscroll, tema de Bridge, modo noche del sistema |
| Sistema | `requestExpandNotificationShade`, `requestOpenAndroidSettings`, `requestOpenBridgeSettings`, `showToast` | `requestLockScreen` / `getCanLockScreen`, `requestOpenDeveloperConsole`, `requestOpenBridgeAppDrawer`, `getLastErrorMessage` |
| Información | — | `getAndroidAPILevel`, `getBridgeVersionName`, `getBridgeVersionCode`, `getProjectURL` |
| Ciclo de vida | `newIntent` (botón de inicio), `beforePause`, `afterResume` | — |

Los **packs de iconos** (`getIconPacksURL`, `getAppIconURL`…) aparecen en la API como borrador, comentados: todavía no existen en Bridge.

---

## Ideas muy de Gingerbread

### 1. Desinstalar arrastrando a la papelera ✅ Hecho
En Gingerbread, arrastrar una app **desde el cajón** hasta la papelera abría el diálogo de desinstalación. Hoy, en nuestro launcher, eso no hace nada.
- **API:** `requestAppUninstall(packageName)`. Android pide confirmación y, si se desinstala, el evento `appRemoved` ya limpia el escritorio.
- **Esfuerzo:** bajo. Es un caso más en `applyDrop()` de `useDragStore`, y un icono de papelera distinto ("Desinstalar") cuando el arrastre viene del cajón.

### 2. "Administrar aplicaciones" e información de la app ✅ Hecho
El menú de Gingerbread tenía "Administrar aplicaciones". Además se podría abrir la ficha de la app al mantenerla pulsada sin moverla, o al soltarla sobre una zona "Info".
- **API:** `requestOpenAppInfo(packageName)` y `requestOpenAndroidSettings()`.
- **Esfuerzo:** bajo.

### 3. Brillo naranja de overscroll ✅ Hecho
**El brillo naranja al llegar al final de una lista se estrenó justo en Gingerbread.** Bridge permite desactivar el efecto moderno de Android (el estiramiento) para dibujar el nuestro: un brillo naranja en el borde del cajón al llegar arriba o abajo, y en los extremos del escritorio al pasar de la primera o la última página.
- **API:** `requestSetOverscrollEffects('none')` y el evento `overscrollEffectsChanged`.
- **Esfuerzo:** medio. Hay que detectar el "tirón" en el borde y dibujar el brillo con un degradado.

### 4. Añadir el icono al instalar una app ✅ Hecho
El Market de la época agregaba el icono al escritorio al instalar una app. Sería una opción en Apariencia: *"Añadir icono al escritorio al instalar"*.
- **API:** el evento `appInstalled`, que ya se recibe, más `findFreeSpot()` del store del escritorio.
- **Esfuerzo:** bajo.

### 5. Widget "Control de energía" ✅ Hecho

> Para el botón del modo noche hay que conceder el permiso una vez con `npm run grant-permissions` (ver "Permisos opcionales" en el README). Bridge 0.1.0alpha no tiene `getCanRequestSystemNightMode()`, así que el launcher intenta el cambio sin poder comprobar el permiso antes.
Imitar el widget clásico de 4×1 con lo que Bridge **sí** puede hacer:
  - **Bloquear pantalla** (`requestLockScreen`).
  - **Modo noche** (`requestSetSystemNightMode`). Requiere dar un permiso a Bridge una sola vez por adb: `adb shell pm grant com.tored.bridgelauncher android.permission.WRITE_SECURE_SETTINGS`.
  - **Notificaciones** (`requestExpandNotificationShade`).
  - **Ajustes** (`requestOpenAndroidSettings`).
- Cada botón se desactiva si no hay permiso, según `getCanLockScreen()` y `getCanRequestSystemNightMode()`, y reacciona a sus eventos `canLockScreenChanged` y `canRequestSystemNightModeChanged`.
- **Esfuerzo:** medio. Aprovecha lo que ya existe para añadir widgets.

### 6. Toques al fondo animado del sistema
Si el usuario elige como fondo del sistema un fondo **animado** (live wallpaper), esos fondos reaccionan a los toques. Eso también era típico de Gingerbread, por ejemplo con el fondo "Nexus" real.
- **API:** `sendWallpaperTap(x, y)` al tocar un hueco vacío cuando el fondo es "Fondo del sistema". Hoy esos toques solo generan pulsos en nuestro fondo Nexus.
- **Esfuerzo:** muy bajo.

### 7. Widget de búsqueda de aplicaciones
Gingerbread traía de serie el widget de búsqueda de Google: una barra de 4×1 con el logo de Google, un campo de texto y el botón del micrófono. Nuestra versión tendría el mismo aspecto, pero buscaría **aplicaciones instaladas**, porque Bridge no puede abrir búsquedas web.
- Al tocar la barra se abre un panel de búsqueda a pantalla completa, al estilo de la búsqueda rápida de Gingerbread: el campo arriba con el teclado abierto y, debajo, la lista de resultados con icono y nombre, que se filtra mientras se escribe.
- La búsqueda ignora mayúsculas y tildes ("camara" encuentra "Cámara"), pone primero los nombres que empiezan por el texto y después los que lo contienen. Si hay una sola coincidencia, "Intro" en el teclado la abre.
- Se podrían mostrar las **apps usadas hace poco** cuando el campo está vacío, guardadas en localStorage, como hacía la búsqueda rápida.
- El logo de Google se sustituye por una lupa o un texto propio ("Buscar aplicaciones"), para no usar la marca.
- **API:** la lista de apps que ya carga el cajón (`getAppsURL`) y `requestLaunchApp(packageName)`. El panel se cierra con el botón de inicio (`newIntent`, a través de `useMenuStore`) y con el truco de `history.pushState` que ya usa el cajón para el botón Atrás.
- **Limitaciones:** no hay búsqueda web (Bridge no abre URLs ni intents) ni búsqueda por voz (el WebView de Android no soporta `SpeechRecognition`), así que el botón del micrófono se omite o solo enfoca el campo. Tampoco se puede responder a la tecla física de búsqueda de los teléfonos de la época.
- **Esfuerzo:** medio. Hay que añadir el tipo de widget (`WidgetKind`/`WIDGET_SIZES`, `HomeGrid.vue`, `DragLayer.vue` y `AddDialog.vue`) y el panel de búsqueda. Además, el teclado puede tapar los resultados, por lo que conviene hacerlo junto con la idea 9.

---

## Mejoras de uso

### 8. Doble toque para bloquear la pantalla
No existía en Gingerbread, pero es muy práctico. Sería opcional en Apariencia.
- **API:** `requestLockScreen()` y `getCanLockScreen()`. Requiere activar el servicio de accesibilidad de Bridge y permitir el bloqueo en sus ajustes. En Android 9 y posteriores, después de bloquear así hay que desbloquear con el PIN, no con la huella; Bridge lo advierte en su documentación.
- **Esfuerzo:** bajo.

### 9. Que el teclado no tape los campos
Al escribir la ciudad del tiempo o renombrar una carpeta, el teclado puede tapar el campo.
- **API:** `getImeWindowInsets()` y el evento `imeWindowInsetsChanged`, para subir el contenido lo que ocupa el teclado.
- **Esfuerzo:** bajo.

### 10. Cambio de página por el borde sin chocar con el gesto "Atrás"
Al arrastrar un icono al borde para pasar de página, esa zona coincide con el gesto de volver atrás de Android.
- **API:** `getSystemGesturesWindowInsets()` y `getMandatorySystemGesturesWindowInsets()`, para usar esa zona como referencia en `EDGE_PX` (`useDragStore`).
- **Esfuerzo:** bajo.

### 11. Esquivar la cámara con precisión
La barra de Gingerbread deja el centro libre "a ojo". Con la forma real del recorte se puede reservar justo ese espacio y colocar las notificaciones y los iconos a su alrededor.
- **API:** `getDisplayCutoutPath()` (Android 12+) y `getDisplayShapePath()` (Android 14+, esquinas redondeadas de la pantalla). Ambas devuelven un path SVG.
- **Esfuerzo:** medio.

---

## Herramientas y mantenimiento

### 12. Pantalla "Acerca de" y diagnóstico
Una opción en el menú (o una pulsación larga en "Bridge") que muestre:
- La versión de Bridge (`getBridgeVersionName` / `getBridgeVersionCode`) y de Android (`getAndroidAPILevel`).
- **Los insets que reporta Bridge en ese momento.** Nos habría ahorrado adivinar cuando la barra de estado medía 0.
- El último error de la API (`getLastErrorMessage`).
- Un botón para abrir la **consola de desarrollo** de Bridge (`requestOpenDeveloperConsole`).
- **Esfuerzo:** bajo.

### 13. Detectar funciones según la versión
Usar `getAndroidAPILevel()` para ocultar las opciones que el teléfono no soporta. Por ejemplo, la forma del recorte solo existe desde Android 12, y el modo noche "personalizado" desde Android 11.
- **Esfuerzo:** bajo, y se hace junto con las funciones que lo necesiten.

### 14. Errores con el estilo del launcher
Hoy, cuando algo falla, Bridge muestra su propio aviso (`showToastIfFailed`). Se podría pasar `false` y mostrar el error con un aviso al estilo Gingerbread, usando `getLastErrorMessage()` para el texto.
- **Esfuerzo:** bajo.

---

## Lo que la API no permite (sin ampliar Bridge)

- Widgets nativos de Android.
- Leer notificaciones, controlar la música o leer la señal móvil y el Wi-Fi reales.
- Saber qué apps son las predeterminadas (teléfono, navegador…).
- Abrir URLs, búsquedas o intents que no sean "abrir una app".
- Detectar el botón Atrás.
- Packs de iconos: están en la API como borrador, pero todavía no los ofrece Bridge.

Todo esto requeriría ampliar Bridge en Kotlin, en un fork del [launcher](https://github.com/bridgelauncher/launcher).
